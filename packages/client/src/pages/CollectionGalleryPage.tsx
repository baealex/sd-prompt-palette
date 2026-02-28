import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

import { getCollections } from '~/api';
import { MasonryColumns } from '~/components/domain/MasonryColumns';
import { Pagination } from '~/components/domain/Pagination';
import { Image } from '~/components/domain/Image';
import { Notice } from '~/components/ui/Notice';
import {
    applyCollectionFilterSearch,
    buildCollectionViewPath,
    normalizeCollectionFilterText,
    parseCollectionSort,
    resolveCollectionSortOrder,
} from '~/features/collection/view-filter';
import type { Collection } from '~/models/types';
import { usePathStore } from '~/state/path-store';

const LIMIT = 20;

type CollectionGalleryItem = Pick<Collection, 'id' | 'title' | 'image'>;
interface CollectionGalleryPayload {
    items: CollectionGalleryItem[];
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

const buildCollectionGalleryPath = (next: {
    query: string;
    model: string;
    sort: ReturnType<typeof parseCollectionSort>;
    page: number;
}) => {
    return buildCollectionViewPath('/collection/gallery', next);
};

export const CollectionGalleryPage = () => {
    const navigate = useNavigate();
    const { setPath } = usePathStore();
    const gallerySearch = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            const modelValue = (search as Record<string, unknown>).model;
            const sortValue = (search as Record<string, unknown>).sort;
            const pageValue = (search as Record<string, unknown>).page;
            return {
                query: normalizeCollectionFilterText(queryValue),
                model: normalizeCollectionFilterText(modelValue),
                sort: parseCollectionSort(sortValue),
                page: parsePage(pageValue),
            };
        },
    });
    const query = gallerySearch.query;
    const model = gallerySearch.model;
    const sort = gallerySearch.sort;
    const currentPage = gallerySearch.page;

    useEffect(() => {
        setPath(
            'collection',
            buildCollectionGalleryPath({
                query,
                model,
                sort,
                page: currentPage,
            }),
        );
    }, [currentPage, model, query, setPath, sort]);

    const collectionsQuery = useQuery({
        queryKey: [
            'collections',
            'gallery',
            query,
            model,
            sort,
            currentPage,
        ] as const,
        queryFn: async () => {
            const response = await getCollections({
                page: currentPage,
                limit: LIMIT,
                query,
                model,
                ...resolveCollectionSortOrder(sort),
            });

            const responseCollections =
                response.data.allCollections.collections.map((collection) => ({
                    id: collection.id,
                    title: collection.title,
                    image: collection.image,
                }));
            const total = response.data.allCollections.pagination.total;
            const responseLastPage = getLastPage(total, LIMIT);

            return {
                items: responseCollections,
                page: currentPage,
                lastPage: responseLastPage,
                total,
            } satisfies CollectionGalleryPayload;
        },
        placeholderData: (previousData) => previousData,
    });

    const items = collectionsQuery.data?.items ?? [];
    const loading = collectionsQuery.isPending;
    const totalPages = collectionsQuery.data?.lastPage ?? 1;
    const totalItems = collectionsQuery.data?.total ?? 0;
    const error =
        collectionsQuery.error instanceof Error
            ? collectionsQuery.error.message
            : null;

    useEffect(() => {
        if (
            !collectionsQuery.data ||
            currentPage <= collectionsQuery.data.lastPage
        ) {
            return;
        }

        const safePage = collectionsQuery.data.lastPage;
        void navigate({
            to: '/collection/gallery',
            replace: true,
            search: (previousSearch) => {
                const nextSearch = {
                    ...(previousSearch as Record<string, unknown>),
                };
                applyCollectionFilterSearch(nextSearch, { query, model, sort });

                if (safePage > 1) {
                    nextSearch.page = safePage;
                } else {
                    delete nextSearch.page;
                }
                return nextSearch;
            },
        });
    }, [collectionsQuery.data, currentPage, model, navigate, query, sort]);

    const handlePageChange = useCallback(
        (nextPage: number) => {
            void navigate({
                to: '/collection/gallery',
                replace: true,
                search: (previousSearch) => {
                    const nextSearch = {
                        ...(previousSearch as Record<string, unknown>),
                    };
                    applyCollectionFilterSearch(nextSearch, {
                        query,
                        model,
                        sort,
                    });

                    if (nextPage > 1) {
                        nextSearch.page = nextPage;
                    } else {
                        delete nextSearch.page;
                    }
                    return nextSearch;
                },
            });
        },
        [model, navigate, query, sort],
    );

    const placeholderText = loading
        ? 'Loading collections...'
        : items.length === 0
          ? 'No collections found.'
          : null;

    return (
        <>
            {placeholderText ? (
                <Notice variant="neutral">{placeholderText}</Notice>
            ) : (
                <MasonryColumns
                    items={items}
                    getItemKey={(item) => item.id}
                    renderItem={(item) => (
                        <Link
                            to="/collection/$id"
                            params={{ id: String(item.id) }}
                            className="group relative block overflow-hidden rounded-token-md border border-line bg-surface-base shadow-surface"
                        >
                            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 -translate-y-full bg-overlay/60 p-4 text-center text-sm font-semibold text-ink-inverse transition group-hover:translate-y-0">
                                {item.title || '(untitled)'}
                            </div>
                            <Image
                                className="block h-auto w-full object-cover"
                                src={item.image.url}
                                alt={item.title}
                                width={item.image.width}
                                height={item.image.height}
                            />
                        </Link>
                    )}
                />
            )}

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

            {error ? (
                <Notice variant="error" className="mt-4">
                    {error}
                </Notice>
            ) : null}
        </>
    );
};
