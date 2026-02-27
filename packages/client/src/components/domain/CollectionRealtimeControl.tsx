import { useQueryClient } from '@tanstack/react-query';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState } from 'react';

import { getLiveConfig, listLiveDirectories, syncLiveImages, updateLiveConfig } from '~/api';
import type { LiveConfig, LiveDirectoryEntry, LiveStatusResponse } from '~/api';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Notice } from '~/components/ui/Notice';
import { useLiveCollectionsRealtime } from '~/features/collection/use-live-collections-realtime';

const toDraft = (config: LiveConfig | null) => {
    if (!config) {
        return {
            watchDir: '',
            ingestMode: 'copy' as const,
            deleteSourceOnDelete: false,
            enabled: false,
        };
    }

    return {
        watchDir: config.watchDir || '',
        ingestMode: config.ingestMode === 'move' ? 'move' as const : 'copy' as const,
        deleteSourceOnDelete: Boolean(config.deleteSourceOnDelete),
        enabled: Boolean(config.enabled),
    };
};

const mergeLiveConfig = (current: LiveConfig | null, payload: Partial<LiveStatusResponse>): LiveConfig => {
    const fallback: LiveConfig = current ?? {
        watchDir: '',
        ingestMode: 'copy',
        deleteSourceOnDelete: false,
        enabled: false,
        updatedAt: Date.now(),
    };

    return {
        watchDir: payload.watchDir ?? fallback.watchDir,
        ingestMode: payload.ingestMode === 'move' ? 'move' : 'copy',
        deleteSourceOnDelete: typeof payload.deleteSourceOnDelete === 'boolean'
            ? payload.deleteSourceOnDelete
            : fallback.deleteSourceOnDelete,
        enabled: typeof payload.enabled === 'boolean' ? payload.enabled : fallback.enabled,
        updatedAt: typeof payload.updatedAt === 'number' ? payload.updatedAt : fallback.updatedAt,
    };
};

export const CollectionRealtimeControl = () => {
    const queryClient = useQueryClient();

    const [error, setError] = useState<string | null>(null);
    const [liveConfig, setLiveConfig] = useState<LiveConfig | null>(null);
    const [syncingNow, setSyncingNow] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [draftWatchDir, setDraftWatchDir] = useState('');
    const [draftIngestMode, setDraftIngestMode] = useState<'copy' | 'move'>('copy');
    const [draftDeleteSourceOnDelete, setDraftDeleteSourceOnDelete] = useState(false);
    const [draftEnabled, setDraftEnabled] = useState(false);

    const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
    const [directoryBrowserLoading, setDirectoryBrowserLoading] = useState(false);
    const [directoryCurrentPath, setDirectoryCurrentPath] = useState('');
    const [directoryParentPath, setDirectoryParentPath] = useState<string | null>(null);
    const [directoryRoots, setDirectoryRoots] = useState<string[]>([]);
    const [directoryEntries, setDirectoryEntries] = useState<LiveDirectoryEntry[]>([]);

    const syncDraftFromLiveConfig = useCallback((config: LiveConfig | null) => {
        const draft = toDraft(config);
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
        try {
            const response = await getLiveConfig();
            setLiveConfig(response.data.config);
            syncDraftFromLiveConfig(response.data.config);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to load sync settings');
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
                setError(response.data.message || 'Failed to browse server directories');
                return;
            }

            setDirectoryCurrentPath(response.data.currentPath || '');
            setDirectoryParentPath(response.data.parentPath || null);
            setDirectoryRoots(Array.isArray(response.data.roots) ? response.data.roots : []);
            setDirectoryEntries(Array.isArray(response.data.directories) ? response.data.directories : []);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to browse server directories');
        } finally {
            setDirectoryBrowserLoading(false);
        }
    }, []);

    const handleOpenSettings = () => {
        syncDraftFromLiveConfig(liveConfig);
        setSettingsOpen(true);
    };

    const handleSaveSettings = async () => {
        if (!draftWatchDir.trim()) {
            setError('Watch directory is required');
            return;
        }

        setSavingSettings(true);
        try {
            const response = await updateLiveConfig({
                watchDir: draftWatchDir.trim(),
                ingestMode: draftIngestMode,
                deleteSourceOnDelete: draftIngestMode === 'copy' ? draftDeleteSourceOnDelete : false,
                enabled: draftEnabled,
            });

            setLiveConfig(response.data.config);
            setSettingsOpen(false);
            setDirectoryBrowserOpen(false);
            setError(null);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to save sync settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSyncNow = async () => {
        setSyncingNow(true);
        try {
            await syncLiveImages();
            await queryClient.invalidateQueries({ queryKey: ['collections'] });
            setError(null);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Sync failed');
        } finally {
            setSyncingNow(false);
        }
    };

    const liveStatusLabel = liveConfig?.enabled ? 'Realtime On' : 'Realtime Off';
    const liveStatusTone = liveConfig?.enabled ? 'bg-success-700' : 'bg-danger-700';

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-token-md border border-line bg-surface-muted px-3 py-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                        <span className={`h-2 w-2 rounded-full ${liveStatusTone}`} />
                        {liveStatusLabel}
                    </span>
                    <span className="text-ink-subtle">|</span>
                    <span>mode: {liveConfig?.ingestMode ?? 'copy'}</span>
                    <span className="text-ink-subtle">|</span>
                    <span className="max-w-[420px] truncate">watch: {liveConfig?.watchDir || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            void handleSyncNow();
                        }}
                        disabled={syncingNow}
                    >
                        {syncingNow ? 'Syncing...' : 'Sync now'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleOpenSettings}>
                        Realtime Settings
                    </Button>
                </div>
            </div>

            {error ? (
                <Notice variant="error" className="mt-3">{error}</Notice>
            ) : null}

            <DialogPrimitive.Root
                open={settingsOpen}
                onOpenChange={(open) => {
                    setSettingsOpen(open);
                    if (!open) {
                        setDirectoryBrowserOpen(false);
                    }
                }}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-900/50" />
                    <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-40 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-token-lg border border-line bg-surface-base p-4 shadow-overlay ui-focus-ring">
                        <DialogPrimitive.Title className="text-lg font-semibold text-ink">
                            Realtime Sync Settings
                        </DialogPrimitive.Title>
                        <div className="mt-4 grid gap-3">
                            <label className="grid gap-1 text-sm font-semibold text-ink-muted">
                                Watch Directory
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <Input
                                        value={draftWatchDir}
                                        onChange={(event) => setDraftWatchDir(event.target.value)}
                                        placeholder="C:\\path\\to\\watch"
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setDirectoryBrowserOpen(true);
                                            const initialPath = draftWatchDir.trim() || liveConfig?.watchDir || undefined;
                                            void loadServerDirectories(initialPath);
                                        }}
                                    >
                                        Browse Server
                                    </Button>
                                </div>
                            </label>

                            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                                <input
                                    type="radio"
                                    name="sync-mode"
                                    value="copy"
                                    checked={draftIngestMode === 'copy'}
                                    onChange={() => setDraftIngestMode('copy')}
                                    className="ui-focus-ring h-4 w-4"
                                />
                                Copy files to library (safe default)
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                                <input
                                    type="radio"
                                    name="sync-mode"
                                    value="move"
                                    checked={draftIngestMode === 'move'}
                                    onChange={() => setDraftIngestMode('move')}
                                    className="ui-focus-ring h-4 w-4"
                                />
                                Move files to library
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                                <input
                                    type="checkbox"
                                    checked={draftDeleteSourceOnDelete}
                                    onChange={(event) => setDraftDeleteSourceOnDelete(event.target.checked)}
                                    disabled={draftIngestMode !== 'copy'}
                                    className="ui-focus-ring h-4 w-4"
                                />
                                Also delete source file when deleting from collection
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                                <input
                                    type="checkbox"
                                    checked={draftEnabled}
                                    onChange={(event) => setDraftEnabled(event.target.checked)}
                                    className="ui-focus-ring h-4 w-4"
                                />
                                Enable realtime watch mode
                            </label>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <DialogPrimitive.Close asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogPrimitive.Close>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    void handleSaveSettings();
                                }}
                                disabled={savingSettings}
                            >
                                {savingSettings ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            <DialogPrimitive.Root
                open={settingsOpen && directoryBrowserOpen}
                onOpenChange={setDirectoryBrowserOpen}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/55" />
                    <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-token-lg border border-line bg-surface-base p-4 shadow-overlay ui-focus-ring">
                        <DialogPrimitive.Title className="text-lg font-semibold text-ink">
                            Server Directory Browser
                        </DialogPrimitive.Title>

                        <div className="mt-3 rounded-token-md border border-line bg-surface-muted px-3 py-2 text-xs text-ink-muted">
                            {directoryCurrentPath || '-'}
                        </div>

                        {directoryRoots.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {directoryRoots.map((rootPath) => (
                                    <Button
                                        key={rootPath}
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            void loadServerDirectories(rootPath);
                                        }}
                                        disabled={directoryBrowserLoading || directoryCurrentPath === rootPath}
                                    >
                                        {rootPath}
                                    </Button>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-3 flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    if (!directoryParentPath || directoryBrowserLoading) {
                                        return;
                                    }
                                    void loadServerDirectories(directoryParentPath);
                                }}
                                disabled={!directoryParentPath || directoryBrowserLoading}
                            >
                                Up
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    const targetPath = directoryCurrentPath || undefined;
                                    void loadServerDirectories(targetPath);
                                }}
                                disabled={directoryBrowserLoading}
                            >
                                Refresh
                            </Button>
                        </div>

                        <div className="mt-3 max-h-[48vh] min-h-[220px] overflow-auto rounded-token-md border border-line bg-surface-muted p-2">
                            {directoryBrowserLoading ? (
                                <Notice variant="neutral" className="text-center">Loading...</Notice>
                            ) : null}

                            {!directoryBrowserLoading && directoryEntries.length === 0 ? (
                                <Notice variant="neutral" className="text-center">No subdirectories</Notice>
                            ) : null}

                            {!directoryBrowserLoading && directoryEntries.length > 0 ? (
                                <div className="grid gap-2">
                                    {directoryEntries.map((entry) => (
                                        <Button
                                            key={entry.path}
                                            variant="secondary"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                void loadServerDirectories(entry.path);
                                            }}
                                        >
                                            {entry.name}
                                        </Button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <DialogPrimitive.Close asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogPrimitive.Close>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    if (!directoryCurrentPath) {
                                        return;
                                    }
                                    setDraftWatchDir(directoryCurrentPath);
                                    setDirectoryBrowserOpen(false);
                                }}
                                disabled={!directoryCurrentPath}
                            >
                                Use This Path
                            </Button>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </>
    );
};
