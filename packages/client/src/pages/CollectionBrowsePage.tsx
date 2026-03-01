import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deleteCollection, getCollections, updateCollection } from '~/api';
import { Image } from '~/components/ui/Image';
import { MasonryColumns } from '~/components/ui/MasonryColumns';
import { Pagination } from '~/components/ui/Pagination';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { IconButton } from '~/components/ui/IconButton';
import { Notice } from '~/components/ui/Notice';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useToast } from '~/components/ui/ToastProvider';
import {
    applyCollectionFilterSearch,
    applyCollectionViewSearch,
    normalizeCollectionFilterText,
    parseCollectionSearchBy,
    parseCollectionSort,
    resolveCollectionSortOrder,
} from '~/features/collection/view-filter';
import { MoreIcon } from '~/icons';
import type { Collection } from '~/models/types';

const LIMIT = 20;
const BROWSE_GALLERY_BREAKPOINTS = [
    { minWidth: 360, columns: 3 },
    { minWidth: 240, columns: 2 },
    { minWidth: 0, columns: 1 },
];

type CollectionBrowseItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;
interface CollectionBrowsePayload {
    items: CollectionBrowseItem[];
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

        const unquoted =
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
                ? trimmed.slice(1, -1)
                : trimmed;
        const parsed = Number(unquoted);
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

const parseSelectedId = (input: unknown) => {
    const parsed = normalizeNumericParam(input);
    if (!parsed || parsed <= 0) {
        return null;
    }
    return Math.trunc(parsed);
};

export const CollectionBrowsePage = () => {
    const navigate = useNavigate();
    const browseSearch = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            const modelValue = (search as Record<string, unknown>).model;
            const sortValue = (search as Record<string, unknown>).sort;
            const searchByValue = (search as Record<string, unknown>).searchBy;
            const pageValue = (search as Record<string, unknown>).page;
            const selectedValue = (search as Record<string, unknown>).selected;
            return {
                query: normalizeCollectionFilterText(queryValue),
                model: normalizeCollectionFilterText(modelValue),
                sort: parseCollectionSort(sortValue),
                searchBy: parseCollectionSearchBy(searchByValue),
                page: parsePage(pageValue),
                selected: parseSelectedId(selectedValue),
            };
        },
    });
    const query = browseSearch.query;
    const model = browseSearch.model;
    const sort = browseSearch.sort;
    const searchBy = browseSearch.searchBy;
    const currentPage = browseSearch.page;
    const selectedId = browseSearch.selected;
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [removing, setRemoving] = useState(false);
    const galleryScrollRef = useRef<HTMLDivElement | null>(null);
    const queryErrorToastRef = useRef<string | null>(null);
    const { pushToast } = useToast();

    const collectionsQuery = useQuery({
        queryKey: ['collections', 'browse', query, model, searchBy, sort, currentPage] as const,
        queryFn: async () => {
            const response = await getCollections({
                page: currentPage,
                limit: LIMIT,
                query,
                model,
                searchBy,
                ...resolveCollectionSortOrder(sort),
            });

            const responseItems = response.data.allCollections.collections
                .map((item) => ({
                    id: Number(item.id),
                    title: item.title,
                    prompt: item.prompt,
                    negativePrompt: item.negativePrompt,
                    image: item.image,
                }))
                .filter((item) => Number.isFinite(item.id) && item.id > 0);
            const total = response.data.allCollections.pagination.total;
            const responseLastPage = getLastPage(total, LIMIT);

            return {
                items: responseItems,
                page: currentPage,
                lastPage: responseLastPage,
                total,
            } satisfies CollectionBrowsePayload;
        },
        placeholderData: (previousData) => previousData,
    });

    const items = collectionsQuery.data?.items ?? [];
    const loading = collectionsQuery.isPending;
    const totalPages = collectionsQuery.data?.lastPage ?? 1;
    const totalItems = collectionsQuery.data?.total ?? 0;
    const queryErrorMessage =
        collectionsQuery.error instanceof Error
            ? collectionsQuery.error.message
            : null;
    const selectItemById = useCallback(
        (nextSelectedId: number) => {
            void navigate({
                to: '/collection',
                replace: true,
                resetScroll: false,
                search: (previousSearch) => {
                    const nextSearch = {
                        ...(previousSearch as Record<string, unknown>),
                    };
                    applyCollectionFilterSearch(nextSearch, {
                        query,
                        model,
                        searchBy,
                        sort,
                    });
                    applyCollectionViewSearch(nextSearch, 'browse');
                    if (currentPage > 1) {
                        nextSearch.page = currentPage;
                    } else {
                        delete nextSearch.page;
                    }
                    nextSearch.selected = nextSelectedId;
                    return nextSearch;
                },
            });
        },
        [currentPage, model, navigate, query, searchBy, sort],
    );

    useEffect(() => {
        if (!queryErrorMessage) {
            queryErrorToastRef.current = null;
            return;
        }
        if (queryErrorToastRef.current === queryErrorMessage) {
            return;
        }
        queryErrorToastRef.current = queryErrorMessage;
        pushToast({
            variant: 'error',
            message: queryErrorMessage,
        });
    }, [pushToast, queryErrorMessage]);

    useEffect(() => {
        galleryScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }, [currentPage, model, query, sort]);

    useEffect(() => {
        if (items.length === 0) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }

            const target = event.target;
            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            event.preventDefault();

            const currentIndex = items.findIndex((item) => item.id === selectedId);
            const nextIndex =
                event.key === 'ArrowLeft'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(items.length - 1, currentIndex + 1);
            const nextItem = items[nextIndex];

            if (!nextItem || nextItem.id === selectedId) {
                return;
            }

            selectItemById(nextItem.id);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [items, selectedId, selectItemById]);

    useEffect(() => {
        if (items.length === 0) {
            if (selectedId !== null) {
                void navigate({
                    to: '/collection',
                    replace: true,
                    resetScroll: false,
                    search: (previousSearch) => {
                        const nextSearch = {
                            ...(previousSearch as Record<string, unknown>),
                        };
                        applyCollectionFilterSearch(nextSearch, {
                            query,
                            model,
                            searchBy,
                            sort,
                        });
                        applyCollectionViewSearch(nextSearch, 'browse');
                        if (currentPage > 1) {
                            nextSearch.page = currentPage;
                        } else {
                            delete nextSearch.page;
                        }
                        delete nextSearch.selected;
                        return nextSearch;
                    },
                });
            }
            return;
        }

        if (selectedId && items.some((item) => item.id === selectedId)) {
            return;
        }

        const fallbackId = items[0].id;
        void navigate({
            to: '/collection',
            replace: true,
            resetScroll: false,
            search: (previousSearch) => {
                const nextSearch = {
                    ...(previousSearch as Record<string, unknown>),
                };
                applyCollectionFilterSearch(nextSearch, {
                    query,
                    model,
                    searchBy,
                    sort,
                });
                applyCollectionViewSearch(nextSearch, 'browse');
                if (currentPage > 1) {
                    nextSearch.page = currentPage;
                } else {
                    delete nextSearch.page;
                }
                nextSearch.selected = fallbackId;
                return nextSearch;
            },
        });
    }, [currentPage, items, model, navigate, query, searchBy, selectedId, sort]);

    const selectedItem = useMemo(() => {
        if (!selectedId) {
            return null;
        }
        return items.find((item) => item.id === selectedId) ?? null;
    }, [items, selectedId]);
    const selectedIndex = useMemo(
        () => items.findIndex((item) => item.id === selectedId),
        [items, selectedId],
    );
    const hasPrevSelection = selectedIndex > 0;
    const hasNextSelection =
        selectedIndex >= 0 && selectedIndex < items.length - 1;
    const handleMoveSelection = useCallback(
        (direction: 'prev' | 'next') => {
            if (selectedIndex < 0) {
                return;
            }
            const nextIndex =
                direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
            const nextItem = items[nextIndex];
            if (!nextItem) {
                return;
            }
            selectItemById(nextItem.id);
        },
        [items, selectedIndex, selectItemById],
    );

    const handlePageChange = useCallback(
        (nextPage: number) => {
            void navigate({
                to: '/collection',
                replace: true,
                resetScroll: false,
                search: (previousSearch) => {
                    const nextSearch = {
                        ...(previousSearch as Record<string, unknown>),
                    };
                    applyCollectionFilterSearch(nextSearch, {
                        query,
                        model,
                        searchBy,
                        sort,
                    });
                    applyCollectionViewSearch(nextSearch, 'browse');

                    if (nextPage > 1) {
                        nextSearch.page = nextPage;
                    } else {
                        delete nextSearch.page;
                    }
                    delete nextSearch.selected;

                    return nextSearch;
                },
            });
        },
        [model, navigate, query, searchBy, sort],
    );

    const openDetail = (collectionId: number) => {
        void navigate({
            to: '/collection/$id',
            params: { id: String(collectionId) },
        });
    };

    const handleRename = async (nextTitle: string) => {
        if (!selectedItem || renaming) {
            return;
        }

        const normalizedTitle = nextTitle.trim();
        if (!normalizedTitle) {
            return;
        }

        setRenaming(true);
        try {
            await updateCollection({
                id: selectedItem.id,
                title: normalizedTitle,
            });
            setRenameDialogOpen(false);
            pushToast({
                variant: 'success',
                message: 'Collection renamed.',
            });
            await collectionsQuery.refetch();
        } catch (nextError) {
            pushToast({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to rename collection',
            });
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem || removing) {
            return;
        }

        setRemoving(true);
        try {
            await deleteCollection({ id: selectedItem.id });
            setRemoveDialogOpen(false);
            pushToast({
                variant: 'success',
                message: 'Collection deleted.',
            });
            await collectionsQuery.refetch();
        } catch (nextError) {
            pushToast({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to delete collection',
            });
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
                <Card className="order-2 h-fit xl:order-1 xl:sticky xl:top-20 xl:self-start">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-ink">
                                Gallery
                            </h2>
                            <Badge variant="neutral">
                                Page {currentPage}/{totalPages}
                            </Badge>
                        </div>
                    </div>
                    <p className="mb-3 text-xs text-ink-muted xl:hidden">
                        Tap a thumbnail to update the preview card above.
                    </p>

                    {loading && items.length === 0 ? (
                        <Notice variant="neutral">
                            Loading collections...
                        </Notice>
                    ) : null}

                    {!loading && items.length === 0 ? (
                        <Notice variant="neutral">No collections found.</Notice>
                    ) : null}

                    {items.length > 0 ? (
                        <div
                            ref={galleryScrollRef}
                            className="xl:max-h-[62vh] xl:overflow-y-auto xl:pr-1"
                        >
                            <MasonryColumns
                                items={items}
                                breakpoints={BROWSE_GALLERY_BREAKPOINTS}
                                breakpointMode="container"
                                className="grid gap-1.5"
                                columnClassName="space-y-1.5"
                                getItemKey={(item) => item.id}
                                renderItem={(item) => (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            selectItemById(item.id);
                                        }}
                                        className={`!h-auto w-full !justify-start gap-0 border p-1.5 text-left transition-colors ${
                                            selectedId === item.id
                                                ? 'border-brand-400 bg-brand-50 shadow-surface'
                                                : 'border-line bg-surface-raised hover:border-brand-200 hover:bg-surface-muted'
                                        }`}
                                    >
                                        <div className="w-full overflow-hidden rounded-token-sm border border-line bg-surface-muted">
                                            <Image
                                                src={item.image.url}
                                                alt={item.title || '(untitled)'}
                                                width={item.image.width}
                                                height={item.image.height}
                                                className="block h-auto w-full"
                                            />
                                        </div>
                                    </Button>
                                )}
                            />
                        </div>
                    ) : null}

                    {items.length > 0 && totalPages > 1 ? (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            variant="compact"
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
                </Card>

                <Card className="order-1 h-fit xl:order-2 xl:sticky xl:top-20 xl:self-start xl:min-h-[68vh]">
                    {selectedItem ? (
                        <>
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-semibold text-ink">
                                        {selectedItem.title || '(untitled)'}
                                    </h2>
                                    <p className="mt-1 text-xs text-ink-muted">
                                        Collection #{selectedItem.id}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            openDetail(selectedItem.id);
                                        }}
                                    >
                                        Open detail
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <IconButton
                                                icon={
                                                    <MoreIcon
                                                        width={16}
                                                        height={16}
                                                    />
                                                }
                                                label="Browse actions"
                                                variant="secondary"
                                                size="md"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" sideOffset={8}>
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    setRenameDialogOpen(true);
                                                }}
                                            >
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-danger-700 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700"
                                                onSelect={() => {
                                                    setRemoveDialogOpen(true);
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            {items.length > 1 ? (
                                <div className="mb-3 grid grid-cols-2 gap-2 xl:hidden">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={!hasPrevSelection}
                                        onClick={() => {
                                            handleMoveSelection('prev');
                                        }}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={!hasNextSelection}
                                        onClick={() => {
                                            handleMoveSelection('next');
                                        }}
                                    >
                                        Next
                                    </Button>
                                </div>
                            ) : null}

                            <div className="overflow-hidden rounded-token-lg border border-line bg-surface-muted">
                                <Image
                                    src={selectedItem.image.url}
                                    alt={selectedItem.title || '(untitled)'}
                                    width={selectedItem.image.width}
                                    height={selectedItem.image.height}
                                    className="block max-h-[52vh] w-full object-contain sm:max-h-[62vh] xl:max-h-[70vh]"
                                />
                            </div>
                        </>
                    ) : (
                        <Notice variant="neutral">
                            Select a collection from the gallery to preview it.
                        </Notice>
                    )}
                </Card>
            </div>

            <PromptDialog
                open={renameDialogOpen}
                title="Rename collection"
                description="Use a title that is easy to scan later."
                defaultValue={selectedItem?.title ?? ''}
                placeholder="Collection title"
                confirmLabel="Save"
                submitting={renaming}
                onSubmit={(nextTitle) => {
                    void handleRename(nextTitle);
                }}
                onOpenChange={(open) => {
                    setRenameDialogOpen(open);
                }}
            />

            <ConfirmDialog
                open={removeDialogOpen}
                title="Delete collection"
                description={
                    selectedItem
                        ? `"${selectedItem.title || '(untitled)'}" will be permanently removed.`
                        : 'This collection will be removed.'
                }
                confirmLabel="Delete"
                confirming={removing}
                danger
                onConfirm={() => {
                    void handleDelete();
                }}
                onOpenChange={(open) => {
                    setRemoveDialogOpen(open);
                }}
            />
        </>
    );
};
