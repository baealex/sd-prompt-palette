import type { ImageMeta } from '~/models';

import type { ParsedImageMeta } from './prompt-reader';
import type { StoredImageMetaInput } from './live-images.types';

const IMAGE_META_RAW_JSON_LIMIT = 64_000;

export function createEmptyParsedMetadata(): ParsedImageMeta {
    return {
        prompt: '',
        negativePrompt: '',
        sourceType: 'unknown',
        parseWarnings: [],
        parseVersion: '',
    };
}

export function buildLegacyPromptText(metadata: ParsedImageMeta): string {
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

export function toStoredImageMetaInput(
    metadata: ParsedImageMeta,
): StoredImageMetaInput {
    const parseWarningsJson = JSON.stringify(
        Array.isArray(metadata.parseWarnings) ? metadata.parseWarnings : [],
    );
    const rawJson = JSON.stringify({
        prompt: metadata.prompt,
        negativePrompt: metadata.negativePrompt,
        sourceType: metadata.sourceType,
        parseWarnings: metadata.parseWarnings,
        parseVersion: metadata.parseVersion,
    });

    return {
        sourceType: metadata.sourceType || 'unknown',
        prompt: metadata.prompt || '',
        negativePrompt: metadata.negativePrompt || '',
        model: metadata.model,
        modelHash: metadata.modelHash,
        baseSampler: metadata.baseSampler,
        baseScheduler: metadata.baseScheduler,
        baseSteps: metadata.baseSteps,
        baseCfgScale: metadata.baseCfgScale,
        baseSeed: metadata.baseSeed,
        upscaleSampler: metadata.upscaleSampler,
        upscaleScheduler: metadata.upscaleScheduler,
        upscaleSteps: metadata.upscaleSteps,
        upscaleCfgScale: metadata.upscaleCfgScale,
        upscaleSeed: metadata.upscaleSeed,
        upscaleFactor: metadata.upscaleFactor,
        upscaler: metadata.upscaler,
        sizeWidth: metadata.sizeWidth,
        sizeHeight: metadata.sizeHeight,
        clipSkip: metadata.clipSkip,
        vae: metadata.vae,
        denoiseStrength: metadata.denoiseStrength,
        parseWarningsJson,
        parseVersion: metadata.parseVersion || '',
        rawJson: rawJson.length <= IMAGE_META_RAW_JSON_LIMIT ? rawJson : undefined,
    };
}

export function toParsedMetadata(stored: ImageMeta): ParsedImageMeta {
    let parseWarnings: string[] = [];
    try {
        const parsed = JSON.parse(stored.parseWarningsJson || '[]');
        if (Array.isArray(parsed)) {
            parseWarnings = parsed.filter((item) => typeof item === 'string');
        }
    } catch {
        parseWarnings = [];
    }

    return {
        prompt: stored.prompt || '',
        negativePrompt: stored.negativePrompt || '',
        sourceType:
            (stored.sourceType as ParsedImageMeta['sourceType']) || 'unknown',
        model: stored.model || undefined,
        modelHash: stored.modelHash || undefined,
        baseSampler: stored.baseSampler || undefined,
        baseScheduler: stored.baseScheduler || undefined,
        baseSteps: stored.baseSteps || undefined,
        baseCfgScale: stored.baseCfgScale || undefined,
        baseSeed: stored.baseSeed || undefined,
        upscaleSampler: stored.upscaleSampler || undefined,
        upscaleScheduler: stored.upscaleScheduler || undefined,
        upscaleSteps: stored.upscaleSteps || undefined,
        upscaleCfgScale: stored.upscaleCfgScale || undefined,
        upscaleSeed: stored.upscaleSeed || undefined,
        upscaleFactor: stored.upscaleFactor || undefined,
        upscaler: stored.upscaler || undefined,
        sizeWidth: stored.sizeWidth || undefined,
        sizeHeight: stored.sizeHeight || undefined,
        clipSkip: stored.clipSkip || undefined,
        vae: stored.vae || undefined,
        denoiseStrength: stored.denoiseStrength || undefined,
        parseWarnings,
        parseVersion: stored.parseVersion || '',
    };
}
