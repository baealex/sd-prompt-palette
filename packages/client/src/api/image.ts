import axios from 'axios';

export interface ImageUploadResponse {
    id: number;
    url: string;
    width: number;
    height: number;
    generatedAt?: string | null;
}

export interface ParsedImageMetadataResponse {
    ok: boolean;
    metadata: {
        prompt: string;
        negativePrompt: string;
        sourceType: 'a1111_parameters' | 'comfy_prompt' | 'exif' | 'unknown';
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
    };
}

export function imageUpload(data: { image: string }) {
    return axios.request<ImageUploadResponse>({
        method: 'POST',
        url: '/api/image',
        data,
    });
}

export function parseImageMetadata(data: { image: string }) {
    return axios.request<ParsedImageMetadataResponse>({
        method: 'POST',
        url: '/api/image/metadata',
        data,
    });
}
