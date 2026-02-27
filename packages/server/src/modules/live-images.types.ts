export const DEFAULT_LIMIT = 60;
export const MAX_LIMIT = 200;

export type IngestMode = 'copy' | 'move';

export interface PromptCacheItem {
    mtimeMs: number;
    prompt: string;
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
    updatedAt: number;
}

export interface RegisterLibraryFileOptions {
    knownHash?: string;
    preferredDate?: Date;
    sourcePath?: string;
    ensureCollectionForExisting?: boolean;
}
