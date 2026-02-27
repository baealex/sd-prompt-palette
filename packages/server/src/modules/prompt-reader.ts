import fs from 'fs';
import path from 'path';
import { inflateSync } from 'zlib';
import exifr from 'exifr';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MAX_PROMPT_LENGTH = 24000;

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
        const inflated = inflateSync(compressed);
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
            textData = inflateSync(textData);
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

function collectPromptTexts(nodeId: string, nodeMap: Map<string, any>, visited: Set<string>): string[] {
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

function formatComfyPrompt(rawPrompt: string): string | null {
    const parsed = parseJsonSafely(rawPrompt);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
    }

    const nodeMap = new Map<string, any>();
    for (const [nodeId, node] of Object.entries(parsed as Record<string, unknown>)) {
        if (node && typeof node === 'object' && !Array.isArray(node)) {
            nodeMap.set(nodeId, node);
        }
    }

    if (nodeMap.size === 0) {
        return null;
    }

    const positiveTexts: string[] = [];
    const negativeTexts: string[] = [];

    for (const node of Array.from(nodeMap.values())) {
        const classType = typeof node.class_type === 'string' ? node.class_type.toLowerCase() : '';
        if (!classType.includes('ksampler')) {
            continue;
        }

        const positiveRef = resolveNodeIdFromReference(node.inputs?.positive);
        if (positiveRef) {
            positiveTexts.push(...collectPromptTexts(positiveRef, nodeMap, new Set<string>()));
        }

        const negativeRef = resolveNodeIdFromReference(node.inputs?.negative);
        if (negativeRef) {
            negativeTexts.push(...collectPromptTexts(negativeRef, nodeMap, new Set<string>()));
        }
    }

    const dedupedPositive = uniqueText(positiveTexts);
    const dedupedNegative = uniqueText(negativeTexts);

    const sections: string[] = [];
    if (dedupedPositive.length > 0) {
        sections.push(`Positive Prompt\n${dedupedPositive.join('\n\n')}`);
    }
    if (dedupedNegative.length > 0) {
        sections.push(`Negative Prompt\n${dedupedNegative.join('\n\n')}`);
    }
    if (sections.length > 0) {
        return sections.join('\n\n');
    }

    const fallbackTexts = uniqueText(
        Array.from(nodeMap.values())
            .map((node) => (typeof node?.inputs?.text === 'string' ? node.inputs.text : ''))
            .filter(Boolean)
    );

    if (fallbackTexts.length === 0) {
        return null;
    }

    return fallbackTexts.join('\n\n');
}

function pickPromptFromMetadata(entries: Map<string, string>): string | null {
    const parameters = normalizePromptText(entries.get('parameters'));
    if (parameters) {
        return parameters;
    }

    const promptRaw = entries.get('prompt');
    if (promptRaw) {
        const comfyPrompt = normalizePromptText(formatComfyPrompt(promptRaw));
        if (comfyPrompt) {
            return comfyPrompt;
        }

        const rawPrompt = normalizePromptText(promptRaw);
        if (rawPrompt) {
            return rawPrompt;
        }
    }

    const candidateKeys = ['comment', 'description', 'usercomment', 'imagedescription', 'xpcomment'];
    for (const key of candidateKeys) {
        const candidate = normalizePromptText(entries.get(key));
        if (candidate) {
            return candidate;
        }
    }

    return null;
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

async function readPromptFromPng(filePath: string): Promise<string | null> {
    const buffer = await fs.promises.readFile(filePath);
    const entries = readPngTextEntries(buffer);
    return pickPromptFromMetadata(entries);
}

async function readPromptFromExif(filePath: string): Promise<string | null> {
    try {
        const metadata = await exifr.parse(filePath);
        if (!metadata || typeof metadata !== 'object') {
            return null;
        }
        const entries = buildExifTextEntryMap(metadata as Record<string, unknown>);
        return pickPromptFromMetadata(entries);
    } catch {
        return null;
    }
}

export async function readImagePrompt(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.png') {
        const prompt = await readPromptFromPng(filePath);
        if (prompt) {
            return prompt;
        }
    }

    return (await readPromptFromExif(filePath)) || '';
}
