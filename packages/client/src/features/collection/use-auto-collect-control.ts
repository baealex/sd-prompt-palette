import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { getLiveConfig, listLiveDirectories, syncLiveImages, updateLiveConfig } from '~/api';
import type { LiveConfig, LiveDirectoryEntry, LiveStatusResponse } from '~/api';
import { useLiveCollectionsRealtime } from '~/features/collection/use-live-collections-realtime';

import { mergeLiveConfig, normalizeWatchDir, toLiveConfigDraft } from './live-config-utils';

type FeedbackVariant = 'info' | 'success' | 'warning' | 'error';

export interface FeedbackState {
    variant: FeedbackVariant;
    message: string;
}

interface UseAutoCollectControlResult {
    feedback: FeedbackState | null;
    loadingConfig: boolean;
    collectingNow: boolean;
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
    const [togglingEnabled, setTogglingEnabled] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [draftWatchDir, setDraftWatchDir] = useState('');
    const [draftIngestMode, setDraftIngestMode] = useState<'copy' | 'move'>('copy');
    const [draftDeleteSourceOnDelete, setDraftDeleteSourceOnDelete] = useState(false);
    const [draftEnabled, setDraftEnabled] = useState(false);

    const [directoryBrowserVisible, setDirectoryBrowserVisible] = useState(false);
    const [directoryBrowserLoading, setDirectoryBrowserLoading] = useState(false);
    const [directoryCurrentPath, setDirectoryCurrentPath] = useState('');
    const [directoryParentPath, setDirectoryParentPath] = useState<string | null>(null);
    const [directoryRoots, setDirectoryRoots] = useState<string[]>([]);
    const [directoryEntries, setDirectoryEntries] = useState<LiveDirectoryEntry[]>([]);

    const syncDraftFromLiveConfig = useCallback((config: LiveConfig | null) => {
        const draft = toLiveConfigDraft(config);
        setDraftWatchDir(draft.watchDir);
        setDraftIngestMode(draft.ingestMode);
        setDraftDeleteSourceOnDelete(draft.deleteSourceOnDelete);
        setDraftEnabled(draft.enabled);
    }, []);

    const handleRealtimeStatus = useCallback((payload: Partial<LiveStatusResponse>) => {
        setLiveConfig((previous) => mergeLiveConfig(previous, payload));
    }, []);

    useLiveCollectionsRealtime({ onStatus: handleRealtimeStatus });

    const loadSyncConfig = useCallback(async () => {
        setLoadingConfig(true);
        try {
            const response = await getLiveConfig();
            setLiveConfig(response.data.config);
            syncDraftFromLiveConfig(response.data.config);
            setFeedback(null);
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message: nextError instanceof Error ? nextError.message : 'Failed to load Auto Collect settings',
            });
        } finally {
            setLoadingConfig(false);
        }
    }, [syncDraftFromLiveConfig]);

    useEffect(() => {
        void loadSyncConfig();
    }, [loadSyncConfig]);

    const loadServerDirectories = useCallback(async (targetPath?: string) => {
        setDirectoryBrowserLoading(true);
        try {
            const response = await listLiveDirectories(targetPath ? { path: targetPath } : {});
            if (!response.data.ok) {
                setFeedback({
                    variant: 'error',
                    message: response.data.message || 'Failed to browse server directories',
                });
                return;
            }

            setDirectoryCurrentPath(response.data.currentPath || '');
            setDirectoryParentPath(response.data.parentPath || null);
            setDirectoryRoots(Array.isArray(response.data.roots) ? response.data.roots : []);
            setDirectoryEntries(Array.isArray(response.data.directories) ? response.data.directories : []);
            setFeedback(null);
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message: nextError instanceof Error ? nextError.message : 'Failed to browse server directories',
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
            await queryClient.invalidateQueries({ queryKey: ['collections'] });
            setFeedback({
                variant: 'success',
                message: `Collect completed (${response.data.scanned} scanned)`,
            });
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message: nextError instanceof Error ? nextError.message : 'Collect failed',
            });
        } finally {
            setCollectingNow(false);
        }
    }, [queryClient]);

    const handleToggleEnabled = async () => {
        if (!liveConfig) {
            setFeedback({ variant: 'warning', message: 'Auto Collect settings are still loading.' });
            return;
        }

        const nextEnabled = !Boolean(liveConfig.enabled);
        const currentEnabled = Boolean(liveConfig.enabled);
        const currentWatchDir = normalizeWatchDir(liveConfig.watchDir || '');

        if (nextEnabled && !currentWatchDir) {
            syncDraftFromLiveConfig(liveConfig);
            setSettingsOpen(true);
            setFeedback({ variant: 'warning', message: 'Set a Watch Folder before enabling Auto Collect.' });
            return;
        }

        setFeedback(null);
        setTogglingEnabled(true);
        setLiveConfig((previous) => mergeLiveConfig(previous, { enabled: nextEnabled }));

        try {
            const response = await updateLiveConfig({ enabled: nextEnabled });
            setLiveConfig(response.data.config);

            if (nextEnabled) {
                setFeedback({ variant: 'success', message: 'Auto Collect enabled.' });
            } else {
                setFeedback({ variant: 'success', message: 'Auto Collect disabled.' });
            }
        } catch (nextError) {
            setLiveConfig((previous) => mergeLiveConfig(previous, { enabled: currentEnabled }));
            setFeedback({
                variant: 'error',
                message: nextError instanceof Error ? nextError.message : 'Failed to update Auto Collect',
            });
        } finally {
            setTogglingEnabled(false);
        }
    };

    const handleSaveSettings = async () => {
        const normalizedWatchDir = normalizeWatchDir(draftWatchDir);
        if (!normalizedWatchDir) {
            setFeedback({ variant: 'warning', message: 'Watch Folder is required.' });
            return;
        }

        setSavingSettings(true);
        try {
            const response = await updateLiveConfig({
                watchDir: normalizedWatchDir,
                ingestMode: draftIngestMode,
                deleteSourceOnDelete: draftIngestMode === 'copy' ? draftDeleteSourceOnDelete : false,
                enabled: draftEnabled,
            });

            setLiveConfig(response.data.config);
            syncDraftFromLiveConfig(response.data.config);
            setSettingsOpen(false);
            setDirectoryBrowserVisible(false);
            setFeedback({ variant: 'success', message: 'Auto Collect settings saved.' });
        } catch (nextError) {
            setFeedback({
                variant: 'error',
                message: nextError instanceof Error ? nextError.message : 'Failed to save Auto Collect settings',
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
    const modeLabel: 'Copy' | 'Move' = liveConfig?.ingestMode === 'move' ? 'Move' : 'Copy';

    const baseDraft = toLiveConfigDraft(liveConfig);
    const normalizedDraftWatchDir = normalizeWatchDir(draftWatchDir);
    const normalizedBaseWatchDir = normalizeWatchDir(baseDraft.watchDir);
    const effectiveDraftDeleteSource = draftIngestMode === 'copy' ? draftDeleteSourceOnDelete : false;
    const effectiveBaseDeleteSource = baseDraft.ingestMode === 'copy' ? baseDraft.deleteSourceOnDelete : false;
    const hasDraftChanges = normalizedDraftWatchDir !== normalizedBaseWatchDir
        || draftIngestMode !== baseDraft.ingestMode
        || effectiveDraftDeleteSource !== effectiveBaseDeleteSource
        || draftEnabled !== baseDraft.enabled;

    return {
        feedback,
        loadingConfig,
        collectingNow,
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
