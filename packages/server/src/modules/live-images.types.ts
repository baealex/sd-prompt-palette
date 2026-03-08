import type { ParsedImageMeta } from './prompt-reader';

export const DEFAULT_LIMIT = 60;
export const MAX_LIMIT = 200;

export type IngestMode = 'copy' | 'move';

export interface PromptCacheItem {
    mtimeMs: number;
    prompt: string;
    metadata?: ParsedImageMeta;
}

export interface StoredImageMetaInput {
    sourceType: string;
    prompt?: string;
    negativePrompt?: string;
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
    parseWarningsJson: string;
    parseVersion: string;
    rawJson?: string;
}

export interface ListParams {
    page: number;
    limit: number;
}

export interface ListItem {
    id: number;
    name: string;
    url: string;
    width: number;
    height: number;
    createdAt: number;
}

export interface ListPayload {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    images: ListItem[];
}

export interface PromptParts {
    prompt: string;
    negativePrompt: string;
}

export interface LiveSyncConfig {
    watchDir: string;
    ingestMode: IngestMode;
    deleteSourceOnDelete: boolean;
    enabled: boolean;
    updatedAt: number;
}

export interface UpdateLiveSyncConfigInput {
    watchDir?: string;
    ingestMode?: IngestMode;
    deleteSourceOnDelete?: boolean;
    enabled?: boolean;
}

export interface LiveImagesStatus {
    watchDir: string;
    libraryDir: string;
    ingestMode: IngestMode;
    deleteSourceOnDelete: boolean;
    enabled: boolean;
    watchersRunning: boolean;
    initialized: boolean;
    syncing: boolean;
    syncReason: string | null;
    syncScanned: number | null;
    syncUpdatedAt: number;
    updatedAt: number;
}

export interface RegisterLibraryFileOptions {
    knownHash?: string;
    preferredDate?: Date;
    sourcePath?: string;
    ensureCollectionForExisting?: boolean;
}
