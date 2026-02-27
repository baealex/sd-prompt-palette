export interface KeywordToCategory {
    id: number;
    order: number;
}

export interface Keyword {
    id: number;
    name: string;
    image?: Image;
    categories?: KeywordToCategory[];
}

export interface Category {
    id: number;
    name: string;
    order: number;
    keywords: Keyword[];
}

export interface Image {
    id: number;
    url: string;
    width: number;
    height: number;
    createdAt?: string;
}

export interface GeneratedMetadata {
    sourceType: string;
    prompt: string;
    negativePrompt: string;
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
    createdAtFromMeta?: string;
    parseWarnings: string[];
    parseVersion: string;
}

export interface Collection {
    id: number;
    image: Image;
    title: string;
    prompt: string;
    negativePrompt: string;
    fileCreatedAt?: string | null;
    fileModifiedAt?: string | null;
    generatedMetadata?: GeneratedMetadata | null;
}
