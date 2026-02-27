import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { deleteCollection, getCollections, updateCollection } from '~/api';
import { CollectionCard } from '~/components/domain/CollectionCard';
import { Pagination } from '~/components/domain/Pagination';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { Notice } from '~/components/ui/Notice';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';
import type { Collection } from '~/models/types';
import { usePathStore } from '~/state/path-store';

const LIMIT = 20;

type CollectionListItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;
interface CollectionListPayload {
    items: CollectionListItem[];
    page: number;
    lastPage: number;
    total: number;
}

const getLastPage = (total: number, limit: number) => {
    return Math.max(1, Math.ceil(total / limit));
};

const normalizeNumericParam = (input: unknown): number | null => {
    if (typeof input === 'number') {
        return Number.isFinite(input) ? input : null;
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) {
            return null;
        }
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

const parsePage = (input: unknown) => {
    const parsed = normalizeNumericParam(input);
    if (!parsed || parsed <= 0) {
        return 1;
    }
    return Math.max(1, Math.trunc(parsed));
};

const buildCollectionListPath = (next: { query: string; page: number }) => {
    const params = new URLSearchParams();
    if (next.query) {
        params.set('query', next.query);
    }
    if (next.page > 1) {
        params.set('page', String(next.page));
    }
    const queryString = params.toString();
    return queryString ? `/collection?${queryString}` : '/collection';
};

export const CollectionListPage = () => {
    const navigate = useNavigate();
    const { copyToClipboard } = useClipboardToast();
    const { setPath } = usePathStore();
    const listSearch = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            const pageValue = (search as Record<string, unknown>).page;
            return {
                query: typeof queryValue === 'string' ? queryValue : '',
                page: parsePage(pageValue),
            };
        },
    });

    const query = listSearch.query;
    const currentPage = listSearch.page;
    const [error, setError] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [renameTarget, setRenameTarget] = useState<CollectionListItem | null>(
        null,
    );
    const [removeTarget, setRemoveTarget] = useState<CollectionListItem | null>(
        null,
    );

    useEffect(() => {
        setPath(
            'collection',
            buildCollectionListPath({ query, page: currentPage }),
        );
    }, [currentPage, query, setPath]);

    const collectionsQuery = useQuery({
        queryKey: ['collections', 'list', query, currentPage] as const,
        queryFn: async () => {
            const response = await getCollections({
                page: currentPage,
                limit: LIMIT,
                query,
            });

            const responseItems = response.data.allCollections.collections.map(
                (item) => ({
                    id: item.id,
                    title: item.title,
                    prompt: item.prompt,
                    negativePrompt: item.negativePrompt,
                    image: item.image,
                }),
            );
            const total = response.data.allCollections.pagination.total;
            const responseLastPage = getLastPage(total, LIMIT);

            return {
                items: responseItems,
                page: currentPage,
                lastPage: responseLastPage,
                total,
            } satisfies CollectionListPayload;
        },
        placeholderData: (previousData) => previousData,
    });

    const items = collectionsQuery.data?.items ?? [];
    const loading = collectionsQuery.isPending;
    const totalPages = collectionsQuery.data?.lastPage ?? 1;
    const totalItems = collectionsQuery.data?.total ?? 0;

    useEffect(() => {
        if (
            !collectionsQuery.data ||
            currentPage <= collectionsQuery.data.lastPage
        ) {
            return;
        }

        const safePage = collectionsQuery.data.lastPage;
        void navigate({
            to: '/collection',
            replace: true,
            search: (previousSearch) => {
                const nextSearch = {
                    ...(previousSearch as Record<string, unknown>),
                };
                if (query) {
                    nextSearch.query = query;
                } else {
                    delete nextSearch.query;
                }

                if (safePage > 1) {
                    nextSearch.page = safePage;
                } else {
                    delete nextSearch.page;
                }
                return nextSearch;
            },
        });
    }, [collectionsQuery.data, currentPage, navigate, query]);

    const handlePageChange = useCallback(
        (nextPage: number) => {
            void navigate({
                to: '/collection',
                replace: true,
                search: (previousSearch) => {
                    const nextSearch = {
                        ...(previousSearch as Record<string, unknown>),
                    };
                    if (query) {
                        nextSearch.query = query;
                    } else {
                        delete nextSearch.query;
                    }

                    if (nextPage > 1) {
                        nextSearch.page = nextPage;
                    } else {
                        delete nextSearch.page;
                    }
                    return nextSearch;
                },
            });
        },
        [navigate, query],
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
            await updateCollection({
                id: renameTarget.id,
                title: nextTitle.trim(),
            });
            await collectionsQuery.refetch();
            setError(null);
            setRenameTarget(null);
        } catch (nextError) {
            setError(
                nextError instanceof Error
                    ? nextError.message
                    : 'Failed to rename collection',
            );
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
            await collectionsQuery.refetch();
            setError(null);
            setRemoveTarget(null);
        } catch (nextError) {
            setError(
                nextError instanceof Error
                    ? nextError.message
                    : 'Failed to delete collection',
            );
        } finally {
            setRemovingId(null);
        }
    };

    const queryErrorMessage =
        collectionsQuery.error instanceof Error
            ? collectionsQuery.error.message
            : null;
    const displayError = error ?? queryErrorMessage;

    return (
        <>
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

            {items.length > 0 && totalPages > 1 ? (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={LIMIT}
                    onPageChange={handlePageChange}
                />
            ) : null}

            {items.length > 0 ? (
                <p className="mt-2 text-xs text-ink-muted">
                    {totalItems} collections total
                </p>
            ) : null}

            {displayError ? (
                <Notice variant="error" className="mt-4">
                    {displayError}
                </Notice>
            ) : null}

            <PromptDialog
                open={renameTarget !== null}
                title="Rename collection"
                description="Use a title that is easy to scan later."
                defaultValue={renameTarget?.title ?? ''}
                placeholder="Collection title"
                submitting={
                    renameTarget !== null && renamingId === renameTarget.id
                }
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
                description={
                    removeTarget
                        ? `"${removeTarget.title || '(untitled)'}" will be permanently removed.`
                        : 'This collection will be removed.'
                }
                confirmLabel="Delete"
                confirming={
                    removeTarget !== null && removingId === removeTarget.id
                }
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
        </>
    );
};
