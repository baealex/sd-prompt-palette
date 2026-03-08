import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { getLiveConfig, listLiveDirectories, syncLiveImages, updateLiveConfig } from '~/api';
import type { LiveConfig, LiveDirectoryEntry, LiveStatusResponse } from '~/api';
import { collectionQueryKeys } from '~/features/collection/query-keys';
import { useLiveCollectionsRealtime } from '~/features/collection/use-live-collections-realtime';

import {
    mergeLiveConfig,
    normalizeWatchDir,
    toLiveConfigDraft,
} from './live-config-utils';

type FeedbackVariant = 'info' | 'success' | 'warning' | 'error';

export interface FeedbackState {
    variant: FeedbackVariant;
    message: string;
}

interface UseAutoCollectControlResult {
    feedback: FeedbackState | null;
    loadingConfig: boolean;
    collectingNow: boolean;
    statusSyncing: boolean;
    statusSyncReason: string | null;
    statusSyncScanned: number | null;
    statusSyncUpdatedAt: number | null;
    togglingEnabled: boolean;
    savingSettings: boolean;
    settingsOpen: boolean;
    statusEnabled: boolean;
    statusLabel: 'On' | 'Off';
    statusTone: string;
    watchDirLabel: string;
    modeLabel: 'Copy' | 'Move';
    draftWatchDir: string;
    draftIngestMode: 'copy' | 'move';
    draftDeleteSourceOnDelete: boolean;
    draftEnabled: boolean;
    normalizedDraftWatchDir: string;
    hasDraftChanges: boolean;
    directoryBrowserVisible: boolean;
    directoryBrowserLoading: boolean;
    directoryCurrentPath: string;
    directoryParentPath: string | null;
    directoryRoots: string[];
    directoryEntries: LiveDirectoryEntry[];
    liveConfig: LiveConfig | null;
    setDraftWatchDir: (value: string) => void;
    setDraftIngestMode: (value: 'copy' | 'move') => void;
    setDraftDeleteSourceOnDelete: (value: boolean) => void;
    setDraftEnabled: (value: boolean) => void;
    setDirectoryBrowserVisible: (value: boolean) => void;
    loadServerDirectories: (targetPath?: string) => Promise<void>;
    handleOpenSettings: () => void;
    handleSettingsOpenChange: (open: boolean) => void;
    handleToggleEnabled: () => Promise<void>;
    handleCollectNow: () => Promise<void>;
    handleSaveSettings: () => Promise<void>;
}

export const useAutoCollectControl = (): UseAutoCollectControlResult => {
    const queryClient = useQueryClient();

    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [liveConfig, setLiveConfig] = useState<LiveConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [collectingNow, setCollectingNow] = useState(false);
    const [statusSyncing, setStatusSyncing] = useState(false);
    const [statusSyncReason, setStatusSyncReason] = useState<string | null>(
        null,
    );
    const [statusSyncScanned, setStatusSyncScanned] = useState<number | null>(
        null,
    );
    const [statusSyncUpdatedAt, setStatusSyncUpdatedAt] = useState<
        number | null
    >(null);
    const [togglingEnabled, setTogglingEnabled] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [draftWatchDir, setDraftWatchDir] = useState('');
    const [draftIngestMode, setDraftIngestMode] = useState<'copy' | 'move'>(
        'copy',
    );
    const [draftDeleteSourceOnDelete, setDraftDeleteSourceOnDelete] =
        useState(false);
    const [draftEnabled, setDraftEnabled] = useState(false);

    const [directoryBrowserVisible, setDirectoryBrowserVisible] =
        useState(false);
    const [directoryBrowserLoading, setDirectoryBrowserLoading] =
        useState(false);
    const [directoryCurrentPath, setDirectoryCurrentPath] = useState('');
    const [directoryParentPath, setDirectoryParentPath] = useState<
        string | null
    >(null);
    const [directoryRoots, setDirectoryRoots] = useState<string[]>([]);
    const [directoryEntries, setDirectoryEntries] = useState<
        LiveDirectoryEntry[]
    >([]);

    const syncDraftFromLiveConfig = useCallback((config: LiveConfig | null) => {
        const draft = toLiveConfigDraft(config);
        setDraftWatchDir(draft.watchDir);
        setDraftIngestMode(draft.ingestMode);
        setDraftDeleteSourceOnDelete(draft.deleteSourceOnDelete);
        setDraftEnabled(draft.enabled);
    }, []);

    const handleRealtimeStatus = useCallback(
        (payload: Partial<LiveStatusResponse>) => {
            setLiveConfig((previous) => mergeLiveConfig(previous, payload));
            if (typeof payload.syncing === 'boolean') {
                setStatusSyncing(payload.syncing);
            }
            if (
                typeof payload.syncReason === 'string' ||
                payload.syncReason === null
            ) {
                setStatusSyncReason(payload.syncReason);
            }
            if (
                typeof payload.syncScanned === 'number' ||
                payload.syncScanned === null
            ) {
                setStatusSyncScanned(payload.syncScanned);
            }
            if (typeof payload.syncUpdatedAt === 'number') {
                setStatusSyncUpdatedAt(payload.syncUpdatedAt);
            }
        },
        [],
    );

    useLiveCollectionsRealtime({ onStatus: handleRealtimeStatus });

    const loadSyncConfig = useCallback(async () => {
        setLoadingConfig(true);
        try {
            const response = await getLiveConfig();
            setLiveConfig(response.data.config);
            setStatusSyncing(Boolean(response.data.status?.syncing));
            setStatusSyncReason(response.data.status?.syncReason || null);
            setStatusSyncScanned(response.data.status?.syncScanned ?? null);
            setStatusSyncUpdatedAt(
                typeof response.data.status?.syncUpdatedAt === 'number'
                    ? response.data.status.syncUpdatedAt
                    : null,
            );
            syncDraftFromLiveConfig(response.data.config);
            setFeedback(null);
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to load Auto Collect settings',
            });
        } finally {
            setLoadingConfig(false);
        }
    }, [syncDraftFromLiveConfig]);

    useEffect(() => {
        void loadSyncConfig();
    }, [loadSyncConfig]);

    const loadServerDirectories = useCallback(async (targetPath?: string) => {
        const resolvePayload = async (
            payload: LiveDirectoriesResponse,
            requestedPath?: string,
        ): Promise<LiveDirectoriesResponse> => {
            const roots = Array.isArray(payload.roots) ? payload.roots : [];
            const hasCurrentPath = Boolean(
                normalizeWatchDir(payload.currentPath || ''),
            );
            const shouldOpenFirstRoot =
                !requestedPath && !hasCurrentPath && roots.length > 0;

            if (!shouldOpenFirstRoot) {
                return payload;
            }

            const rootResponse = await listLiveDirectories({ path: roots[0] });
            if (rootResponse.data.ok) {
                return rootResponse.data;
            }

            return payload;
        };

        const applyPayload = (payload: LiveDirectoriesResponse) => {
            setDirectoryCurrentPath(payload.currentPath || '');
            setDirectoryParentPath(payload.parentPath || null);
            setDirectoryRoots(
                Array.isArray(payload.roots) ? payload.roots : [],
            );
            setDirectoryEntries(
                Array.isArray(payload.directories) ? payload.directories : [],
            );
        };

        setDirectoryBrowserLoading(true);
        try {
            const response = await listLiveDirectories(
                targetPath ? { path: targetPath } : {},
            );
            if (!response.data.ok) {
                setFeedback({
                    variant: 'error',
                    message:
                        response.data.message ||
                        'Failed to browse server directories',
                });
                return;
            }

            const nextPayload = await resolvePayload(response.data, targetPath);
            applyPayload(nextPayload);
            setFeedback(null);
        } catch (nextError) {
            const status = (nextError as { response?: { status?: number } })
                ?.response?.status;
            const shouldRecoverWithDefault =
                Boolean(targetPath) && (status === 404 || status === 400);

            if (shouldRecoverWithDefault) {
                try {
                    const fallbackResponse = await listLiveDirectories();
                    if (fallbackResponse.data.ok) {
                        const fallbackPayload = await resolvePayload(
                            fallbackResponse.data,
                        );
                        applyPayload(fallbackPayload);
                        setFeedback({
                            variant: 'warning',
                            message:
                                'Saved path is unavailable. Showing available directories.',
                        });
                        return;
                    }
                } catch {
                    // If recovery fails, fall through to standard error feedback.
                }
            }

            setFeedback({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to browse server directories',
            });
        } finally {
            setDirectoryBrowserLoading(false);
        }
    }, []);

    const handleOpenSettings = () => {
        syncDraftFromLiveConfig(liveConfig);
        setDirectoryBrowserVisible(false);
        setSettingsOpen(true);
    };

    const runCollect = useCallback(async () => {
        setCollectingNow(true);
        try {
            const response = await syncLiveImages();
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: collectionQueryKeys.listRoot(),
                    exact: false,
                }),
                queryClient.invalidateQueries({
                    queryKey: collectionQueryKeys.showcaseRoot(),
                    exact: false,
                }),
                queryClient.invalidateQueries({
                    queryKey: collectionQueryKeys.modelOptions(),
                    exact: true,
                }),
            ]);
            setFeedback({
                variant: 'success',
                message: `Collect completed (${response.data.scanned} scanned)`,
            });
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Collect failed',
            });
        } finally {
            setCollectingNow(false);
        }
    }, [queryClient]);

    const handleToggleEnabled = async () => {
        if (!liveConfig) {
            setFeedback({
                variant: 'warning',
                message: 'Auto Collect settings are still loading.',
            });
            return;
        }

        const nextEnabled = !Boolean(liveConfig.enabled);
        const currentEnabled = Boolean(liveConfig.enabled);
        const currentWatchDir = normalizeWatchDir(liveConfig.watchDir || '');

        if (nextEnabled && !currentWatchDir) {
            syncDraftFromLiveConfig(liveConfig);
            setSettingsOpen(true);
            setFeedback({
                variant: 'warning',
                message: 'Set a Watch Folder before enabling Auto Collect.',
            });
            return;
        }

        setFeedback(null);
        setTogglingEnabled(true);
        setLiveConfig((previous) =>
            mergeLiveConfig(previous, { enabled: nextEnabled }),
        );

        try {
            const response = await updateLiveConfig({ enabled: nextEnabled });
            setLiveConfig(response.data.config);

            if (nextEnabled) {
                setFeedback({
                    variant: 'success',
                    message: 'Auto Collect enabled.',
                });
            } else {
                setFeedback({
                    variant: 'success',
                    message: 'Auto Collect disabled.',
                });
            }
        } catch (nextError) {
            setLiveConfig((previous) =>
                mergeLiveConfig(previous, { enabled: currentEnabled }),
            );
            setFeedback({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to update Auto Collect',
            });
        } finally {
            setTogglingEnabled(false);
        }
    };

    const handleSaveSettings = async () => {
        const normalizedWatchDir = normalizeWatchDir(draftWatchDir);
        if (!normalizedWatchDir) {
            setFeedback({
                variant: 'warning',
                message: 'Watch Folder is required.',
            });
            return;
        }

        setSavingSettings(true);
        try {
            const response = await updateLiveConfig({
                watchDir: normalizedWatchDir,
                ingestMode: draftIngestMode,
                deleteSourceOnDelete:
                    draftIngestMode === 'copy'
                        ? draftDeleteSourceOnDelete
                        : false,
                enabled: draftEnabled,
            });

            setLiveConfig(response.data.config);
            syncDraftFromLiveConfig(response.data.config);
            setSettingsOpen(false);
            setDirectoryBrowserVisible(false);
            setFeedback({
                variant: 'success',
                message: 'Auto Collect settings saved.',
            });
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to save Auto Collect settings',
            });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleCollectNow = async () => {
        await runCollect();
    };

    const handleSettingsOpenChange = (open: boolean) => {
        setSettingsOpen(open);
        if (!open) {
            setDirectoryBrowserVisible(false);
            syncDraftFromLiveConfig(liveConfig);
        }
    };

    const statusEnabled = Boolean(liveConfig?.enabled);
    const statusLabel: 'On' | 'Off' = statusEnabled ? 'On' : 'Off';
    const statusTone = statusEnabled ? 'bg-success-700' : 'bg-danger-700';
    const watchDirLabel = normalizeWatchDir(liveConfig?.watchDir || '') || '-';
    const modeLabel: 'Copy' | 'Move' =
        liveConfig?.ingestMode === 'move' ? 'Move' : 'Copy';

    const baseDraft = toLiveConfigDraft(liveConfig);
    const normalizedDraftWatchDir = normalizeWatchDir(draftWatchDir);
    const normalizedBaseWatchDir = normalizeWatchDir(baseDraft.watchDir);
    const effectiveDraftDeleteSource =
        draftIngestMode === 'copy' ? draftDeleteSourceOnDelete : false;
    const effectiveBaseDeleteSource =
        baseDraft.ingestMode === 'copy'
            ? baseDraft.deleteSourceOnDelete
            : false;
    const hasDraftChanges =
        normalizedDraftWatchDir !== normalizedBaseWatchDir ||
        draftIngestMode !== baseDraft.ingestMode ||
        effectiveDraftDeleteSource !== effectiveBaseDeleteSource ||
        draftEnabled !== baseDraft.enabled;

    return {
        feedback,
        loadingConfig,
        collectingNow,
        statusSyncing,
        statusSyncReason,
        statusSyncScanned,
        statusSyncUpdatedAt,
        togglingEnabled,
        savingSettings,
        settingsOpen,
        statusEnabled,
        statusLabel,
        statusTone,
        watchDirLabel,
        modeLabel,
        draftWatchDir,
        draftIngestMode,
        draftDeleteSourceOnDelete,
        draftEnabled,
        normalizedDraftWatchDir,
        hasDraftChanges,
        directoryBrowserVisible,
        directoryBrowserLoading,
        directoryCurrentPath,
        directoryParentPath,
        directoryRoots,
        directoryEntries,
        liveConfig,
        setDraftWatchDir,
        setDraftIngestMode,
        setDraftDeleteSourceOnDelete,
        setDraftEnabled,
        setDirectoryBrowserVisible,
        loadServerDirectories,
        handleOpenSettings,
        handleSettingsOpenChange,
        handleToggleEnabled,
        handleCollectNow,
        handleSaveSettings,
    };
};
