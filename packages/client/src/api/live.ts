import axios from 'axios';

export interface LiveStatusResponse {
    ok: boolean;
    config?: LiveConfig;
    watchDir: string;
    libraryDir: string;
    ingestMode: 'copy' | 'move';
    deleteSourceOnDelete?: boolean;
    enabled?: boolean;
    watchersRunning?: boolean;
    initialized: boolean;
    syncing?: boolean;
    syncReason?: string | null;
    syncScanned?: number | null;
    syncUpdatedAt?: number;
    updatedAt?: number;
}

export interface LiveConfig {
    watchDir: string;
    ingestMode: 'copy' | 'move';
    deleteSourceOnDelete: boolean;
    enabled: boolean;
    updatedAt: number;
}

export interface LiveConfigResponse {
    ok: boolean;
    config: LiveConfig;
    status: LiveStatusResponse;
}

export interface LiveImage {
    id: number;
    name: string;
    url: string;
    width: number;
    height: number;
    createdAt: number;
}

export interface LiveImagesResponse {
    ok: boolean;
    reason?: string;
    updatedAt: number;
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    images: LiveImage[];
}

export interface LiveDirectoryEntry {
    name: string;
    path: string;
}

export interface LiveDirectoriesResponse {
    ok: boolean;
    currentPath?: string;
    parentPath?: string | null;
    roots?: string[];
    directories?: LiveDirectoryEntry[];
    message?: string;
}

export interface LiveImageMetadataResponse {
    ok: boolean;
    id: number;
    prompt: string;
    negativePrompt: string;
    sourceType: 'a1111_parameters' | 'comfy_prompt' | 'exif' | 'unknown';
    parseVersion: string;
    warnings: string[];
    metadata: {
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
    };
}

export function getLiveStatus() {
    return axios.request<LiveStatusResponse>({
        method: 'GET',
        url: '/api/live/status',
    });
}

export function getLiveConfig() {
    return axios.request<LiveConfigResponse>({
        method: 'GET',
        url: '/api/live/config',
    });
}

export function updateLiveConfig(data: Partial<LiveConfig>) {
    return axios.request<LiveConfigResponse>({
        method: 'PUT',
        url: '/api/live/config',
        data,
    });
}

export function listLiveDirectories(data: { path?: string } = {}) {
    return axios.request<LiveDirectoriesResponse>({
        method: 'GET',
        url: '/api/live/config/directories',
        params: data.path ? { path: data.path } : undefined,
    });
}

export function pickLiveDirectory() {
    return axios.request<{
        ok: boolean;
        path?: string;
        canceled?: boolean;
        message?: string;
    }>({
        method: 'POST',
        url: '/api/live/config/pick-dir',
    });
}

export function getLiveImages(data: { page?: number; limit?: number } = {}) {
    return axios.request<LiveImagesResponse>({
        method: 'GET',
        url: '/api/live/images',
        params: data,
    });
}

export function getLiveImagePrompt(data: { id: number }) {
    return axios.request<{ ok: boolean; id: number; prompt: string }>({
        method: 'GET',
        url: `/api/live/images/${data.id}/prompt`,
    });
}

export function getLiveImageMetadata(data: { id: number }) {
    return axios.request<LiveImageMetadataResponse>({
        method: 'GET',
        url: `/api/live/images/${data.id}/metadata`,
    });
}

export function deleteLiveImage(data: { id: number }) {
    return axios.request<{ ok: boolean }>({
        method: 'DELETE',
        url: `/api/live/images/${data.id}`,
    });
}

export function syncLiveImages() {
    return axios.request<{ ok: boolean; scanned: number }>({
        method: 'POST',
        url: '/api/live/sync',
    });
}
