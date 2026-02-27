import fs from 'fs';
import path from 'path';
import { inflateSync } from 'zlib';
import exifr from 'exifr';
import { extractPromptParts } from './live-images.utils';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_PROMPT_LENGTH = 24000;
const MAX_IMAGE_FILE_SIZE_BYTES = 40 * 1024 * 1024;
const MAX_INFLATE_OUTPUT_BYTES = 512 * 1024;
const PARSE_VERSION = '2026-02-27.2';

type SourceType = 'a1111_parameters' | 'comfy_prompt' | 'exif' | 'unknown';

export interface ParsedImageMeta {
    prompt: string;
    negativePrompt: string;
    sourceType: SourceType;
    model?: string;
    modelHash?: string;
    baseSampler?: string;
    baseScheduler?: string;
    baseSteps?: number;
    baseCfgScale?: number;
    baseSeed?: string;
    upscaleSampler?: string;
    upscaleScheduler?: string;
    upscaleSteps?: number;
    upscaleCfgScale?: number;
    upscaleSeed?: string;
    upscaleFactor?: number;
    upscaler?: string;
    sizeWidth?: number;
    sizeHeight?: number;
    clipSkip?: number;
    vae?: string;
    denoiseStrength?: number;
    parseWarnings: string[];
    parseVersion: string;
}

interface PromptGraphNode {
    class_type?: unknown;
    inputs?: Record<string, unknown>;
}

function normalizePromptText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const cleaned = value.replace(/\0/g, '').trim();
    if (!cleaned) {
        return null;
    }

    if (cleaned.length <= MAX_PROMPT_LENGTH) {
        return cleaned;
    }

    return `${cleaned.slice(0, MAX_PROMPT_LENGTH)}\n\n...[truncated]`;
}

function decodeBufferText(buffer: Buffer | Uint8Array, encoding: BufferEncoding = 'utf8'): string {
    const target = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const decoded = target.toString(encoding);
    if (encoding === 'utf8' && decoded.includes('\ufffd')) {
        return target.toString('latin1');
    }
    return decoded;
}

function parseTextChunk(data: Buffer): { keyword: string; text: string } | null {
    const separatorIndex = data.indexOf(0);
    if (separatorIndex <= 0) {
        return null;
    }

    const keyword = data.toString('latin1', 0, separatorIndex).trim().toLowerCase();
    if (!keyword) {
        return null;
    }

    const text = decodeBufferText(data.subarray(separatorIndex + 1), 'utf8').trim();
    if (!text) {
        return null;
    }

    return { keyword, text };
}

function parseZtxtChunk(data: Buffer): { keyword: string; text: string } | null {
    const separatorIndex = data.indexOf(0);
    if (separatorIndex <= 0 || separatorIndex + 2 > data.length) {
        return null;
    }

    const keyword = data.toString('latin1', 0, separatorIndex).trim().toLowerCase();
    if (!keyword) {
        return null;
    }

    const compressionMethod = data[separatorIndex + 1];
    if (compressionMethod !== 0) {
        return null;
    }

    const compressed = data.subarray(separatorIndex + 2);
    if (compressed.length === 0) {
        return null;
    }

    try {
        const inflated = inflateSync(compressed, {
            maxOutputLength: MAX_INFLATE_OUTPUT_BYTES,
        });
        const text = decodeBufferText(inflated, 'utf8').trim();
        if (!text) {
            return null;
        }
        return { keyword, text };
    } catch {
        return null;
    }
}

function parseItxtChunk(data: Buffer): { keyword: string; text: string } | null {
    const keywordEnd = data.indexOf(0);
    if (keywordEnd <= 0 || keywordEnd + 3 > data.length) {
        return null;
    }

    const keyword = data.toString('latin1', 0, keywordEnd).trim().toLowerCase();
    if (!keyword) {
        return null;
    }

    let cursor = keywordEnd + 1;
    const compressionFlag = data[cursor];
    cursor += 1; // compression flag
    cursor += 1; // compression method

    const languageTagEnd = data.indexOf(0, cursor);
    if (languageTagEnd < 0) {
        return null;
    }
    cursor = languageTagEnd + 1;

    const translatedKeywordEnd = data.indexOf(0, cursor);
    if (translatedKeywordEnd < 0) {
        return null;
    }
    cursor = translatedKeywordEnd + 1;

    let textData = data.subarray(cursor);
    if (compressionFlag === 1) {
        try {
            textData = inflateSync(textData, {
                maxOutputLength: MAX_INFLATE_OUTPUT_BYTES,
            });
        } catch {
            return null;
        }
    }

    const text = decodeBufferText(textData, 'utf8').trim();
    if (!text) {
        return null;
    }

    return { keyword, text };
}

function readPngTextEntries(buffer: Buffer): Map<string, string> {
    const entries = new Map<string, string>();
    if (buffer.length < PNG_SIGNATURE.length) {
        return entries;
    }

    if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
        return entries;
    }

    let cursor = PNG_SIGNATURE.length;
    while (cursor + 8 <= buffer.length) {
        const dataLength = buffer.readUInt32BE(cursor);
        cursor += 4;

        const chunkType = buffer.toString('ascii', cursor, cursor + 4);
        cursor += 4;

        if (cursor + dataLength + 4 > buffer.length) {
            break;
        }

        const data = buffer.subarray(cursor, cursor + dataLength);
        cursor += dataLength + 4; // data + crc

        let parsed: { keyword: string; text: string } | null = null;
        if (chunkType === 'tEXt') {
            parsed = parseTextChunk(data);
        } else if (chunkType === 'zTXt') {
            parsed = parseZtxtChunk(data);
        } else if (chunkType === 'iTXt') {
            parsed = parseItxtChunk(data);
        }

        if (parsed && !entries.has(parsed.keyword)) {
            entries.set(parsed.keyword, parsed.text);
        }

        if (chunkType === 'IEND') {
            break;
        }
    }

    return entries;
}

function parseJsonSafely(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function uniqueText(values: string[]): string[] {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
        const normalized = value.trim();
        if (!normalized || seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        result.push(normalized);
    }
    return result;
}

function resolveNodeIdFromReference(reference: unknown): string | null {
    if (!Array.isArray(reference) || reference.length === 0) {
        return null;
    }

    const firstValue = reference[0];
    if (typeof firstValue !== 'string' && typeof firstValue !== 'number') {
        return null;
    }

    return String(firstValue);
}

function collectPromptTexts(nodeId: string, nodeMap: Map<string, PromptGraphNode>, visited: Set<string>): string[] {
    if (!nodeId || visited.has(nodeId)) {
        return [];
    }

    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node || typeof node !== 'object') {
        return [];
    }

    const inputs = node.inputs && typeof node.inputs === 'object' ? node.inputs : {};
    const texts: string[] = [];

    if (typeof inputs.text === 'string' && inputs.text.trim()) {
        texts.push(inputs.text.trim());
    }

    const inputValues = Object.values(inputs);
    for (const inputValue of inputValues) {
        const refId = resolveNodeIdFromReference(inputValue);
        if (!refId) {
            continue;
        }
        texts.push(...collectPromptTexts(refId, nodeMap, visited));
    }

    return texts;
}

function buildExifTextEntryMap(metadata: Record<string, unknown>): Map<string, string> {
    const entries = new Map<string, string>();

    for (const [rawKey, rawValue] of Object.entries(metadata)) {
        const key = String(rawKey).trim().toLowerCase();
        if (!key) {
            continue;
        }

        if (typeof rawValue === 'string') {
            entries.set(key, rawValue);
            continue;
        }

        if (Array.isArray(rawValue)) {
            const joined = rawValue.filter((item) => typeof item === 'string').join('\n');
            if (joined) {
                entries.set(key, joined);
            }
            continue;
        }

        if (rawValue instanceof Uint8Array) {
            entries.set(key, decodeBufferText(rawValue, 'utf8'));
        }
    }

    return entries;
}

function toFiniteNumber(input: unknown): number | undefined {
    if (typeof input === 'number') {
        return Number.isFinite(input) ? input : undefined;
    }
    if (typeof input === 'string' && input.trim()) {
        const parsed = Number(input);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function toPositiveInteger(input: unknown): number | undefined {
    const parsed = toFiniteNumber(input);
    if (!parsed) {
        return undefined;
    }
    const integerValue = Math.trunc(parsed);
    return integerValue > 0 ? integerValue : undefined;
}

function toSeedString(input: unknown): string | undefined {
    if (typeof input === 'number' && Number.isFinite(input)) {
        return String(Math.trunc(input));
    }
    if (typeof input === 'string' && input.trim()) {
        return input.trim();
    }
    return undefined;
}

function readLabelValue(source: string, label: string): string | undefined {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matched = source.match(new RegExp(`(?:^|,|\\r|\\n)\\s*${escaped}\\s*:\\s*([^,\\r\\n]+)`, 'i'));
    return matched?.[1]?.trim() || undefined;
}

function splitSamplerAndScheduler(
    samplerValue: string | undefined,
    schedulerValue: string | undefined,
): { sampler?: string; scheduler?: string } {
    const sampler = samplerValue?.trim() || undefined;
    const scheduler = schedulerValue?.trim() || undefined;
    if (!sampler) {
        return { sampler: undefined, scheduler };
    }
    if (scheduler) {
        return { sampler, scheduler };
    }

    const schedulerSuffixes = ['karras', 'exponential', 'normal', 'sgm_uniform', 'ddim_uniform'];
    const normalized = sampler.toLowerCase();
    for (const suffix of schedulerSuffixes) {
        const marker = ` ${suffix}`;
        if (normalized.endsWith(marker)) {
            return {
                sampler: sampler.slice(0, sampler.length - marker.length).trim(),
                scheduler: suffix,
            };
        }
    }

    return { sampler, scheduler: undefined };
}

function parseA1111Metadata(rawParameters: string): Partial<ParsedImageMeta> {
    const parameters = normalizePromptText(rawParameters);
    if (!parameters) {
        return {};
    }

    const promptParts = extractPromptParts(parameters);
    const baseSamplerData = splitSamplerAndScheduler(
        readLabelValue(parameters, 'Sampler'),
        readLabelValue(parameters, 'Schedule type')
    );
    const upscaleSamplerData = splitSamplerAndScheduler(
        readLabelValue(parameters, 'Hires sampler') || readLabelValue(parameters, 'Upscale sampler'),
        readLabelValue(parameters, 'Hires schedule type') || readLabelValue(parameters, 'Upscale schedule type')
    );

    const sizeValue = readLabelValue(parameters, 'Size');
    let sizeWidth: number | undefined;
    let sizeHeight: number | undefined;
    if (sizeValue) {
        const matched = sizeValue.match(/(\d{2,5})\s*x\s*(\d{2,5})/i);
        if (matched) {
            sizeWidth = toPositiveInteger(matched[1]);
            sizeHeight = toPositiveInteger(matched[2]);
        }
    }

    return {
        prompt: normalizePromptText(promptParts.prompt) || '',
        negativePrompt: normalizePromptText(promptParts.negativePrompt) || '',
        sourceType: 'a1111_parameters',
        model: readLabelValue(parameters, 'Model'),
        modelHash: readLabelValue(parameters, 'Model hash'),
        baseSampler: baseSamplerData.sampler,
        baseScheduler: baseSamplerData.scheduler,
        baseSteps: toPositiveInteger(readLabelValue(parameters, 'Steps')),
        baseCfgScale: toFiniteNumber(readLabelValue(parameters, 'CFG scale')),
        baseSeed: toSeedString(readLabelValue(parameters, 'Seed')),
        upscaleSampler: upscaleSamplerData.sampler,
        upscaleScheduler: upscaleSamplerData.scheduler,
        upscaleSteps: toPositiveInteger(readLabelValue(parameters, 'Hires steps') || readLabelValue(parameters, 'Upscale steps')),
        upscaleCfgScale: toFiniteNumber(readLabelValue(parameters, 'Hires CFG scale') || readLabelValue(parameters, 'Upscale CFG scale')),
        upscaleSeed: toSeedString(readLabelValue(parameters, 'Hires seed') || readLabelValue(parameters, 'Upscale seed')),
        upscaleFactor: toFiniteNumber(readLabelValue(parameters, 'Hires upscale') || readLabelValue(parameters, 'Upscale by')),
        upscaler: readLabelValue(parameters, 'Hires upscaler') || readLabelValue(parameters, 'Upscaler'),
        sizeWidth,
        sizeHeight,
        clipSkip: toPositiveInteger(readLabelValue(parameters, 'Clip skip')),
        vae: readLabelValue(parameters, 'VAE'),
        denoiseStrength: toFiniteNumber(readLabelValue(parameters, 'Denoising strength')),
    };
}

function parseComfyMetadata(rawPrompt: string): Partial<ParsedImageMeta> {
    if (!rawPrompt) {
        return {};
    }

    const parsed = parseJsonSafely(rawPrompt);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
    }

    const nodeMap = new Map<string, PromptGraphNode>();
    for (const [nodeId, node] of Object.entries(parsed as Record<string, unknown>)) {
        if (node && typeof node === 'object' && !Array.isArray(node)) {
            nodeMap.set(nodeId, node);
        }
    }

    if (nodeMap.size === 0) {
        return {};
    }

    const positiveTexts: string[] = [];
    const negativeTexts: string[] = [];
    const samplerNodes: Array<{
        id: number;
        steps?: number;
        cfg?: number;
        sampler?: string;
        scheduler?: string;
        seed?: string;
        denoise?: number;
    }> = [];

    let model: string | undefined;
    let vae: string | undefined;
    let sizeWidth: number | undefined;
    let sizeHeight: number | undefined;
    let upscaler: string | undefined;
    let upscaleFactor: number | undefined;
    let clipSkip: number | undefined;

    for (const [nodeId, node] of Array.from(nodeMap.entries())) {
        const classType = typeof node.class_type === 'string' ? node.class_type.toLowerCase() : '';
        const inputs = node.inputs && typeof node.inputs === 'object' ? node.inputs : {};

        if (classType.includes('ksampler')) {
            const positiveRef = resolveNodeIdFromReference(inputs.positive);
            if (positiveRef) {
                positiveTexts.push(...collectPromptTexts(positiveRef, nodeMap, new Set<string>()));
            }

            const negativeRef = resolveNodeIdFromReference(inputs.negative);
            if (negativeRef) {
                negativeTexts.push(...collectPromptTexts(negativeRef, nodeMap, new Set<string>()));
            }

            const samplerData = splitSamplerAndScheduler(
                typeof inputs.sampler_name === 'string' ? inputs.sampler_name : (
                    typeof inputs.sampler === 'string' ? inputs.sampler : undefined
                ),
                typeof inputs.scheduler === 'string' ? inputs.scheduler : undefined
            );

            samplerNodes.push({
                id: Number.isFinite(Number(nodeId)) ? Number(nodeId) : Number.MAX_SAFE_INTEGER,
                steps: toPositiveInteger(inputs.steps),
                cfg: toFiniteNumber(inputs.cfg || inputs.cfg_scale),
                sampler: samplerData.sampler,
                scheduler: samplerData.scheduler,
                seed: toSeedString(inputs.seed),
                denoise: toFiniteNumber(inputs.denoise),
            });
        }

        if (!model && classType.includes('checkpointloader')) {
            model = typeof inputs.ckpt_name === 'string' ? inputs.ckpt_name : undefined;
        }

        if (!vae && classType.includes('vaeloader')) {
            vae = typeof inputs.vae_name === 'string' ? inputs.vae_name : undefined;
        }

        if (sizeWidth === undefined && sizeHeight === undefined && classType.includes('emptylatent')) {
            sizeWidth = toPositiveInteger(inputs.width);
            sizeHeight = toPositiveInteger(inputs.height);
        }

        if (!clipSkip && classType.includes('clipsetlastlayer')) {
            const clipLayer = toFiniteNumber(inputs.stop_at_clip_layer);
            if (clipLayer !== undefined) {
                clipSkip = Math.abs(Math.trunc(clipLayer));
            }
        }

        if (upscaleFactor === undefined && classType.includes('upscale')) {
            upscaleFactor = toFiniteNumber(inputs.scale_by || inputs.upscale_by);
        }

        if (!upscaler && classType.includes('upscale')) {
            upscaler = typeof inputs.upscale_method === 'string'
                ? inputs.upscale_method
                : typeof inputs.upscale_model === 'string'
                    ? inputs.upscale_model
                    : typeof inputs.model_name === 'string'
                        ? inputs.model_name
                        : undefined;
        }
    }

    samplerNodes.sort((a, b) => a.id - b.id);
    const baseSampler = samplerNodes[0];
    const upscaleSampler = samplerNodes[1];

    return {
        prompt: normalizePromptText(uniqueText(positiveTexts).join('\n\n')) || '',
        negativePrompt: normalizePromptText(uniqueText(negativeTexts).join('\n\n')) || '',
        sourceType: 'comfy_prompt',
        model,
        baseSampler: baseSampler?.sampler,
        baseScheduler: baseSampler?.scheduler,
        baseSteps: baseSampler?.steps,
        baseCfgScale: baseSampler?.cfg,
        baseSeed: baseSampler?.seed,
        upscaleSampler: upscaleSampler?.sampler,
        upscaleScheduler: upscaleSampler?.scheduler,
        upscaleSteps: upscaleSampler?.steps,
        upscaleCfgScale: upscaleSampler?.cfg,
        upscaleSeed: upscaleSampler?.seed,
        upscaleFactor,
        upscaler,
        sizeWidth,
        sizeHeight,
        clipSkip,
        vae,
        denoiseStrength: upscaleSampler?.denoise ?? (
            baseSampler?.denoise !== undefined && baseSampler.denoise < 1 ? baseSampler.denoise : undefined
        ),
    };
}

function parseFallbackMetadata(entries: Map<string, string>): Partial<ParsedImageMeta> {
    const candidateKeys = ['comment', 'description', 'usercomment', 'imagedescription', 'xpcomment'];
    const fallbackText = candidateKeys
        .map((key) => normalizePromptText(entries.get(key)))
        .find(Boolean);
    const sourceText = fallbackText || normalizePromptText(entries.get('prompt')) || '';
    const promptParts = sourceText
        ? extractPromptParts(sourceText)
        : {
            prompt: '',
            negativePrompt: '',
        };

    return {
        prompt: normalizePromptText(promptParts.prompt) || '',
        negativePrompt: normalizePromptText(promptParts.negativePrompt) || '',
        sourceType: 'exif',
    };
}

function applyIfMissing<K extends keyof ParsedImageMeta>(
    target: ParsedImageMeta,
    source: Partial<ParsedImageMeta>,
    key: K
): void {
    const nextValue = source[key];
    const currentValue = target[key];
    if (nextValue === undefined || nextValue === null || nextValue === '') {
        return;
    }
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
        return;
    }
    target[key] = nextValue as ParsedImageMeta[K];
}

function mergeMetadata(result: ParsedImageMeta, candidate: Partial<ParsedImageMeta>): void {
    const keys: Array<keyof ParsedImageMeta> = [
        'prompt',
        'negativePrompt',
        'model',
        'modelHash',
        'baseSampler',
        'baseScheduler',
        'baseSteps',
        'baseCfgScale',
        'baseSeed',
        'upscaleSampler',
        'upscaleScheduler',
        'upscaleSteps',
        'upscaleCfgScale',
        'upscaleSeed',
        'upscaleFactor',
        'upscaler',
        'sizeWidth',
        'sizeHeight',
        'clipSkip',
        'vae',
        'denoiseStrength',
    ];

    for (const key of keys) {
        applyIfMissing(result, candidate, key);
    }

    if (result.sourceType === 'unknown' && candidate.sourceType && candidate.sourceType !== 'unknown') {
        result.sourceType = candidate.sourceType;
    }
}

function pickMetadataFromEntries(entries: Map<string, string>, warnings: string[]): ParsedImageMeta {
    const result: ParsedImageMeta = {
        prompt: '',
        negativePrompt: '',
        sourceType: 'unknown',
        parseWarnings: warnings,
        parseVersion: PARSE_VERSION,
    };

    mergeMetadata(result, parseA1111Metadata(entries.get('parameters') || ''));
    mergeMetadata(result, parseComfyMetadata(entries.get('prompt') || ''));
    mergeMetadata(result, parseFallbackMetadata(entries));
    return result;
}

async function readExifEntriesFromBuffer(buffer: Buffer): Promise<Map<string, string>> {
    try {
        const metadata = await exifr.parse(buffer);
        if (!metadata || typeof metadata !== 'object') {
            return new Map<string, string>();
        }
        return buildExifTextEntryMap(metadata as Record<string, unknown>);
    } catch {
        return new Map<string, string>();
    }
}

function mergeEntries(primary: Map<string, string>, secondary: Map<string, string>): Map<string, string> {
    const merged = new Map<string, string>(primary);
    for (const [key, value] of Array.from(secondary.entries())) {
        if (!merged.has(key)) {
            merged.set(key, value);
        }
    }
    return merged;
}

function buildLegacyPromptText(metadata: ParsedImageMeta): string {
    if (!metadata.prompt && !metadata.negativePrompt) {
        return '';
    }
    if (metadata.sourceType === 'comfy_prompt') {
        const sections: string[] = [];
        if (metadata.prompt) {
            sections.push(`Positive Prompt\n${metadata.prompt}`);
        }
        if (metadata.negativePrompt) {
            sections.push(`Negative Prompt\n${metadata.negativePrompt}`);
        }
        return sections.join('\n\n');
    }
    if (!metadata.negativePrompt) {
        return metadata.prompt;
    }
    if (!metadata.prompt) {
        return `Negative prompt: ${metadata.negativePrompt}`;
    }
    return `${metadata.prompt}\nNegative prompt: ${metadata.negativePrompt}`;
}

export async function readImageMetadataFromBuffer(
    buffer: Buffer,
    options: { extension?: string } = {},
): Promise<ParsedImageMeta> {
    const warnings: string[] = [];
    if (!buffer.length) {
        warnings.push('Image buffer is empty');
        return {
            prompt: '',
            negativePrompt: '',
            sourceType: 'unknown',
            parseWarnings: warnings,
            parseVersion: PARSE_VERSION,
        };
    }

    if (buffer.length > MAX_IMAGE_FILE_SIZE_BYTES) {
        warnings.push(`Image exceeds ${MAX_IMAGE_FILE_SIZE_BYTES} byte size limit`);
        return {
            prompt: '',
            negativePrompt: '',
            sourceType: 'unknown',
            parseWarnings: warnings,
            parseVersion: PARSE_VERSION,
        };
    }

    const extension = (options.extension || '').toLowerCase();
    const pngEntries = extension === '.png' || buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
        ? readPngTextEntries(buffer)
        : new Map<string, string>();
    const exifEntries = await readExifEntriesFromBuffer(buffer);

    return pickMetadataFromEntries(mergeEntries(pngEntries, exifEntries), warnings);
}

export async function readImageMetadata(filePath: string): Promise<ParsedImageMeta> {
    try {
        const stat = await fs.promises.stat(filePath);
        if (stat.size > MAX_IMAGE_FILE_SIZE_BYTES) {
            return {
                prompt: '',
                negativePrompt: '',
                sourceType: 'unknown',
                parseWarnings: [`Image exceeds ${MAX_IMAGE_FILE_SIZE_BYTES} byte size limit`],
                parseVersion: PARSE_VERSION,
            };
        }
    } catch {
        return {
            prompt: '',
            negativePrompt: '',
            sourceType: 'unknown',
            parseWarnings: ['Image file could not be read'],
            parseVersion: PARSE_VERSION,
        };
    }

    try {
        const buffer = await fs.promises.readFile(filePath);
        return await readImageMetadataFromBuffer(buffer, {
            extension: path.extname(filePath).toLowerCase(),
        });
    } catch {
        return {
            prompt: '',
            negativePrompt: '',
            sourceType: 'unknown',
            parseWarnings: ['Image file could not be parsed'],
            parseVersion: PARSE_VERSION,
        };
    }
}

export async function readImagePrompt(filePath: string): Promise<string> {
    const metadata = await readImageMetadata(filePath);
    return buildLegacyPromptText(metadata);
}
