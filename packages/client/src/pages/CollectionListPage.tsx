import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { deleteCollection, getCollections, updateCollection } from '~/api';
import { CollectionCard } from '~/components/domain/CollectionCard';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { PageFrame } from '~/components/domain/PageFrame';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { Notice } from '~/components/ui/Notice';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';
import type { Collection } from '~/models/types';
import { usePathStore } from '~/state/path-store';

const LIMIT = 20;

type CollectionListItem = Pick<Collection, 'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'>;
interface CollectionListChunk {
    items: CollectionListItem[];
    page: number;
    lastPage: number;
}

const getLastPage = (total: number, limit: number) => {
    return Math.max(1, Math.ceil(total / limit));
};

export const CollectionListPage = () => {
    const navigate = useNavigate();
    const { copyToClipboard } = useClipboardToast();
    const { setPath } = usePathStore();
    const queryClient = useQueryClient();
    const query = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            return typeof queryValue === 'string' ? queryValue : '';
        },
    });
    const [draftQuery, setDraftQuery] = useState<string>(query);
    const [error, setError] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [renameTarget, setRenameTarget] = useState<CollectionListItem | null>(null);
    const [removeTarget, setRemoveTarget] = useState<CollectionListItem | null>(null);

    useEffect(() => {
        setPath('collection', '/collection');
    }, [setPath]);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

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

    const applySearch = useCallback(() => {
        const nextQuery = draftQuery.trim();
        void navigate({
            to: '/collection',
            replace: true,
            search: (previousSearch) => {
                const nextSearch = { ...(previousSearch as Record<string, unknown>) };
                if (nextQuery) {
                    nextSearch.query = nextQuery;
                } else {
                    delete nextSearch.query;
                }
                return nextSearch;
            },
        });
    }, [draftQuery, navigate]);

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

    const handleRenameRequest = (item: CollectionListItem) => {
        setRenameTarget(item);
    };

    const handleRename = async (nextTitle: string) => {
        if (!renameTarget || !nextTitle.trim()) {
            return;
        }

        setRenamingId(renameTarget.id);
        try {
            await updateCollection({ id: renameTarget.id, title: nextTitle.trim() });
            patchCollectionListCache((previousItems) => previousItems.map((entry) => (
                entry.id === renameTarget.id
                    ? { ...entry, title: nextTitle.trim() }
                    : entry
            )));
            setError(null);
            setRenameTarget(null);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to rename collection');
        } finally {
            setRenamingId(null);
        }
    };

    const handleDeleteRequest = (item: CollectionListItem) => {
        setRemoveTarget(item);
    };

    const handleDelete = async () => {
        if (!removeTarget) {
            return;
        }

        setRemovingId(removeTarget.id);
        try {
            await deleteCollection({ id: removeTarget.id });
            patchCollectionListCache((previousItems) => previousItems.filter((entry) => entry.id !== removeTarget.id));
            setError(null);
            setRemoveTarget(null);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to delete collection');
        } finally {
            setRemovingId(null);
        }
    };

    const queryErrorMessage = collectionsQuery.error instanceof Error ? collectionsQuery.error.message : null;
    const displayError = error ?? queryErrorMessage;

    return (
        <PageFrame
            title="Collection"
            description="Browse, search, and manage saved prompts."
        >
            <div className="mb-6 space-y-4">
                <CollectionSearchBar
                    value={draftQuery}
                    onChange={setDraftQuery}
                    onSubmit={applySearch}
                    placeholder="Search title, prompt, or negative prompt"
                />
                <CollectionNav />
                <CollectionRealtimeControl />
            </div>

            {loading && items.length === 0 ? (
                <Notice variant="neutral">Loading collections...</Notice>
            ) : null}

            {!loading && items.length === 0 ? (
                <Notice variant="neutral">No collections found.</Notice>
            ) : null}

            <div>
                {items.map((item) => (
                    <CollectionCard
                        key={item.id}
                        collection={item}
                        onClickCopy={(text) => {
                            void copyToClipboard(text, { label: 'Prompt' });
                        }}
                        onClickRename={() => {
                            handleRenameRequest(item);
                        }}
                        onClickDelete={() => {
                            handleDeleteRequest(item);
                        }}
                        renaming={renamingId === item.id}
                        removing={removingId === item.id}
                    />
                ))}
            </div>

            {loadingMore ? (
                <Notice variant="neutral" className="mt-4 text-center">Loading more...</Notice>
            ) : null}

            {displayError ? (
                <Notice variant="error" className="mt-4">{displayError}</Notice>
            ) : null}

            <PromptDialog
                open={renameTarget !== null}
                title="Rename collection"
                description="Use a title that is easy to scan later."
                defaultValue={renameTarget?.title ?? ''}
                placeholder="Collection title"
                submitting={renameTarget !== null && renamingId === renameTarget.id}
                onSubmit={(nextTitle) => {
                    void handleRename(nextTitle);
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameTarget(null);
                    }
                }}
            />

            <ConfirmDialog
                open={removeTarget !== null}
                title="Delete collection"
                description={removeTarget ? `"${removeTarget.title || '(untitled)'}" will be permanently removed.` : 'This collection will be removed.'}
                confirmLabel="Delete"
                confirming={removeTarget !== null && removingId === removeTarget.id}
                danger
                onConfirm={() => {
                    void handleDelete();
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setRemoveTarget(null);
                    }
                }}
            />
        </PageFrame>
    );
};
