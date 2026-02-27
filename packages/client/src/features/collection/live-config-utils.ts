import type { LiveConfig, LiveStatusResponse } from '~/api';

export interface LiveConfigDraft {
    watchDir: string;
    ingestMode: 'copy' | 'move';
    deleteSourceOnDelete: boolean;
    enabled: boolean;
}

export const toLiveConfigDraft = (config: LiveConfig | null): LiveConfigDraft => {
    if (!config) {
        return {
            watchDir: '',
            ingestMode: 'copy',
            deleteSourceOnDelete: false,
            enabled: false,
        };
    }

    return {
        watchDir: config.watchDir || '',
        ingestMode: config.ingestMode === 'move' ? 'move' : 'copy',
        deleteSourceOnDelete: Boolean(config.deleteSourceOnDelete),
        enabled: Boolean(config.enabled),
    };
};

export const mergeLiveConfig = (current: LiveConfig | null, payload: Partial<LiveStatusResponse>): LiveConfig => {
    const fallback: LiveConfig = current ?? {
        watchDir: '',
        ingestMode: 'copy',
        deleteSourceOnDelete: false,
        enabled: false,
        updatedAt: Date.now(),
    };

    return {
        watchDir: payload.watchDir ?? fallback.watchDir,
        ingestMode: payload.ingestMode ? (payload.ingestMode === 'move' ? 'move' : 'copy') : fallback.ingestMode,
        deleteSourceOnDelete: typeof payload.deleteSourceOnDelete === 'boolean'
            ? payload.deleteSourceOnDelete
            : fallback.deleteSourceOnDelete,
        enabled: typeof payload.enabled === 'boolean' ? payload.enabled : fallback.enabled,
        updatedAt: typeof payload.updatedAt === 'number' ? payload.updatedAt : fallback.updatedAt,
    };
};

export const normalizeWatchDir = (input: string) => input.trim();
