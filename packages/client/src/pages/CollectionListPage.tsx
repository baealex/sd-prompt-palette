import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
    deleteCollection,
    getCollections,
    getLiveConfig,
    listLiveDirectories,
    syncLiveImages,
    updateCollection,
    updateLiveConfig,
} from '~/api';
import type { LiveConfig, LiveDirectoryEntry } from '~/api';
import { CollectionCard } from '~/components/domain/CollectionCard';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { PageFrame } from '~/components/domain/PageFrame';
import type { Collection } from '~/models/types';
import { usePathStore } from '~/state/path-store';

const LIMIT = 20;

type CollectionListItem = Pick<Collection, 'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'>;
interface CollectionListChunk {
    items: CollectionListItem[];
    page: number;
    lastPage: number;
}

const getInitialQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('query') ?? '';
};

const getLastPage = (total: number, limit: number) => {
    return Math.max(1, Math.ceil(total / limit));
};

const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

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

export const CollectionListPage = () => {
    const { setPath } = usePathStore();
    const queryClient = useQueryClient();
    const [query, setQuery] = useState<string>(getInitialQuery);
    const [draftQuery, setDraftQuery] = useState<string>(getInitialQuery);
    const [error, setError] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

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

    useEffect(() => {
        setPath('collection', '/collection');
    }, [setPath]);

    const syncDraftFromLiveConfig = useCallback((config: LiveConfig | null) => {
        const draft = toDraft(config);
        setDraftWatchDir(draft.watchDir);
        setDraftIngestMode(draft.ingestMode);
        setDraftDeleteSourceOnDelete(draft.deleteSourceOnDelete);
        setDraftEnabled(draft.enabled);
    }, []);

    const collectionsQuery = useInfiniteQuery({
        queryKey: ['collections', 'list', query] as const,
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const response = await getCollections({
                page: pageParam,
                limit: LIMIT,
                query,
            });

            const responseItems = response.data.allCollections.collections.map((item) => ({
                id: item.id,
                title: item.title,
                prompt: item.prompt,
                negativePrompt: item.negativePrompt,
                image: item.image,
            }));
            const responseLastPage = getLastPage(response.data.allCollections.pagination.total, LIMIT);

            return {
                items: responseItems,
                page: pageParam,
                lastPage: responseLastPage,
            } satisfies CollectionListChunk;
        },
        getNextPageParam: (lastChunk) => (lastChunk.page < lastChunk.lastPage ? lastChunk.page + 1 : undefined),
    });

    const items = collectionsQuery.data?.pages.flatMap((chunk) => chunk.items) ?? [];
    const loading = collectionsQuery.isPending;
    const loadingMore = collectionsQuery.isFetchingNextPage;
    const hasNextPage = collectionsQuery.hasNextPage;
    const fetchNextPage = collectionsQuery.fetchNextPage;

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

    useEffect(() => {
        const handleScroll = () => {
            const reachedBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

            if (!hasNextPage || !reachedBottom || loading || loadingMore) {
                return;
            }

            void fetchNextPage()
                .catch((nextError) => {
                    setError(nextError instanceof Error ? nextError.message : 'Failed to load more collections');
                });
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [fetchNextPage, hasNextPage, loading, loadingMore]);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextQuery = draftQuery.trim();
        setQuery(nextQuery);

        const params = new URLSearchParams(window.location.search);
        if (nextQuery) {
            params.set('query', nextQuery);
        } else {
            params.delete('query');
        }

        const nextSearch = params.toString();
        window.history.replaceState(null, '', nextSearch ? `/collection?${nextSearch}` : '/collection');
    };

    const patchCollectionListCache = useCallback(
        (updater: (prevItems: CollectionListItem[]) => CollectionListItem[]) => {
            queryClient.setQueriesData<InfiniteData<CollectionListChunk>>(
                { queryKey: ['collections', 'list'] },
                (previousData) => {
                    if (!previousData) {
                        return previousData;
                    }

                    return {
                        ...previousData,
                        pages: previousData.pages.map((pageChunk) => ({
                            ...pageChunk,
                            items: updater(pageChunk.items),
                        })),
                    };
                },
            );
        },
        [queryClient],
    );

    const handleRename = async (item: CollectionListItem) => {
        const nextTitle = window.prompt('Enter a new title', item.title);
        if (!nextTitle || !nextTitle.trim()) {
            return;
        }

        setRenamingId(item.id);
        try {
            await updateCollection({ id: item.id, title: nextTitle.trim() });
            patchCollectionListCache((previousItems) => previousItems.map((entry) => (
                entry.id === item.id
                    ? { ...entry, title: nextTitle.trim() }
                    : entry
            )));
            setError(null);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to rename collection');
        } finally {
            setRenamingId(null);
        }
    };

    const handleDelete = async (item: CollectionListItem) => {
        const confirmed = window.confirm('Are you sure you want to delete this collection?');
        if (!confirmed) {
            return;
        }

        setRemovingId(item.id);
        try {
            await deleteCollection({ id: item.id });
            patchCollectionListCache((previousItems) => previousItems.filter((entry) => entry.id !== item.id));
            setError(null);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to delete collection');
        } finally {
            setRemovingId(null);
        }
    };

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
    const queryErrorMessage = collectionsQuery.error instanceof Error ? collectionsQuery.error.message : null;
    const displayError = error ?? queryErrorMessage;

    return (
        <PageFrame
            title="Collection"
            description="Collection list with realtime sync controls."
        >
            <CollectionNav />

            <form onSubmit={handleSearchSubmit} className="mx-auto mb-4 max-w-sm">
                <input
                    type="text"
                    value={draftQuery}
                    onChange={(event) => setDraftQuery(event.target.value)}
                    placeholder="Search by title or prompt"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                />
            </form>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-1 font-semibold ${liveConfig?.enabled ? 'border-emerald-500 text-emerald-700' : 'border-rose-500 text-rose-700'}`}>
                        {liveStatusLabel}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1">mode: {liveConfig?.ingestMode ?? 'copy'}</span>
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1">watch: {liveConfig?.watchDir || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            void handleSyncNow();
                        }}
                        disabled={syncingNow}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {syncingNow ? 'Syncing...' : 'Sync now'}
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenSettings}
                        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                        Realtime Settings
                    </button>
                </div>
            </div>

            {loading && items.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Loading collections...</p>
            ) : null}

            {!loading && items.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No collections found.</p>
            ) : null}

            <div>
                {items.map((item) => (
                    <CollectionCard
                        key={item.id}
                        collection={item}
                        onClickCopy={(text) => {
                            void copyText(text);
                        }}
                        onClickRename={() => {
                            void handleRename(item);
                        }}
                        onClickDelete={() => {
                            void handleDelete(item);
                        }}
                        renaming={renamingId === item.id}
                        removing={removingId === item.id}
                    />
                ))}
            </div>

            {loadingMore ? (
                <p className="mt-4 text-center text-sm text-slate-500">Loading more...</p>
            ) : null}

            {settingsOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="presentation">
                    <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-900">Realtime Sync Settings</h3>
                        <div className="mt-4 grid gap-3">
                            <label className="grid gap-1 text-sm font-semibold text-slate-700">
                                Watch Directory
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <input
                                        type="text"
                                        value={draftWatchDir}
                                        onChange={(event) => setDraftWatchDir(event.target.value)}
                                        placeholder="C:\\path\\to\\watch"
                                        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDirectoryBrowserOpen(true);
                                            const initialPath = draftWatchDir.trim() || liveConfig?.watchDir || undefined;
                                            void loadServerDirectories(initialPath);
                                        }}
                                        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        Browse Server
                                    </button>
                                </div>
                            </label>

                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="sync-mode"
                                    value="copy"
                                    checked={draftIngestMode === 'copy'}
                                    onChange={() => setDraftIngestMode('copy')}
                                />
                                Copy files to library (safe default)
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="sync-mode"
                                    value="move"
                                    checked={draftIngestMode === 'move'}
                                    onChange={() => setDraftIngestMode('move')}
                                />
                                Move files to library
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={draftDeleteSourceOnDelete}
                                    onChange={(event) => setDraftDeleteSourceOnDelete(event.target.checked)}
                                    disabled={draftIngestMode !== 'copy'}
                                />
                                Also delete source file when deleting from collection
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={draftEnabled}
                                    onChange={(event) => setDraftEnabled(event.target.checked)}
                                />
                                Enable realtime watch mode
                            </label>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSettingsOpen(false);
                                    setDirectoryBrowserOpen(false);
                                }}
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    void handleSaveSettings();
                                }}
                                disabled={savingSettings}
                                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
                            >
                                {savingSettings ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {settingsOpen && directoryBrowserOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="presentation">
                    <div className="w-full max-w-3xl rounded-xl border border-slate-300 bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-900">Server Directory Browser</h3>

                        <div className="mt-3 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            {directoryCurrentPath || '-'}
                        </div>

                        {directoryRoots.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {directoryRoots.map((rootPath) => (
                                    <button
                                        key={rootPath}
                                        type="button"
                                        onClick={() => {
                                            void loadServerDirectories(rootPath);
                                        }}
                                        disabled={directoryBrowserLoading || directoryCurrentPath === rootPath}
                                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {rootPath}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!directoryParentPath || directoryBrowserLoading) {
                                        return;
                                    }
                                    void loadServerDirectories(directoryParentPath);
                                }}
                                disabled={!directoryParentPath || directoryBrowserLoading}
                                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Up
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const targetPath = directoryCurrentPath || undefined;
                                    void loadServerDirectories(targetPath);
                                }}
                                disabled={directoryBrowserLoading}
                                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="mt-3 max-h-[48vh] min-h-[220px] overflow-auto rounded-md border border-slate-300 bg-slate-50 p-2">
                            {directoryBrowserLoading ? (
                                <div className="rounded border border-dashed border-slate-300 bg-white p-2 text-center text-sm text-slate-500">
                                    Loading...
                                </div>
                            ) : null}

                            {!directoryBrowserLoading && directoryEntries.length === 0 ? (
                                <div className="rounded border border-dashed border-slate-300 bg-white p-2 text-center text-sm text-slate-500">
                                    No subdirectories
                                </div>
                            ) : null}

                            {!directoryBrowserLoading && directoryEntries.length > 0 ? (
                                <div className="grid gap-2">
                                    {directoryEntries.map((entry) => (
                                        <button
                                            key={entry.path}
                                            type="button"
                                            onClick={() => {
                                                void loadServerDirectories(entry.path);
                                            }}
                                            className="rounded border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            {entry.name}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDirectoryBrowserOpen(false)}
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!directoryCurrentPath) {
                                        return;
                                    }
                                    setDraftWatchDir(directoryCurrentPath);
                                    setDirectoryBrowserOpen(false);
                                }}
                                disabled={!directoryCurrentPath}
                                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
                            >
                                Use This Path
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {displayError ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{displayError}</p>
            ) : null}
        </PageFrame>
    );
};
