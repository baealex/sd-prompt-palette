import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { getCollections } from '~/api';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { Pagination } from '~/components/domain/Pagination';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { Image } from '~/components/domain/Image';
import { PageFrame } from '~/components/domain/PageFrame';
import { Notice } from '~/components/ui/Notice';
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

const buildCollectionGalleryPath = (next: { query: string; page: number }) => {
    const params = new URLSearchParams();
    if (next.query) {
        params.set('query', next.query);
    }
    if (next.page > 1) {
        params.set('page', String(next.page));
    }
    const queryString = params.toString();
    return queryString ? `/collection/gallery?${queryString}` : '/collection/gallery';
};

export const CollectionGalleryPage = () => {
    const navigate = useNavigate();
    const { setPath } = usePathStore();
    const gallerySearch = useSearch({
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
    const query = gallerySearch.query;
    const currentPage = gallerySearch.page;
    const [draftQuery, setDraftQuery] = useState<string>(query);

    useEffect(() => {
        setPath('collection', buildCollectionGalleryPath({ query, page: currentPage }));
    }, [currentPage, query, setPath]);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

    const collectionsQuery = useQuery({
        queryKey: ['collections', 'gallery', query, currentPage] as const,
        queryFn: async () => {
            const response = await getCollections({
                page: currentPage,
                limit: LIMIT,
                query,
            });

            const responseCollections = response.data.allCollections.collections.map((collection) => ({
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
    const error = collectionsQuery.error instanceof Error ? collectionsQuery.error.message : null;

    useEffect(() => {
        if (!collectionsQuery.data || currentPage <= collectionsQuery.data.lastPage) {
            return;
        }

        const safePage = collectionsQuery.data.lastPage;
        void navigate({
            to: '/collection/gallery',
            replace: true,
            search: (previousSearch) => {
                const nextSearch = { ...(previousSearch as Record<string, unknown>) };
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

    const applySearch = useCallback(() => {
        const nextQuery = draftQuery.trim();
        void navigate({
            to: '/collection/gallery',
            replace: true,
            search: (previousSearch) => {
                const nextSearch = { ...(previousSearch as Record<string, unknown>) };
                if (nextQuery) {
                    nextSearch.query = nextQuery;
                } else {
                    delete nextSearch.query;
                }
                delete nextSearch.page;
                return nextSearch;
            },
        });
    }, [draftQuery, navigate]);

    const handlePageChange = useCallback((nextPage: number) => {
        void navigate({
            to: '/collection/gallery',
            replace: true,
            search: (previousSearch) => {
                const nextSearch = { ...(previousSearch as Record<string, unknown>) };
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
    }, [navigate, query]);

    const placeholderText = loading
        ? 'Loading collections...'
        : items.length === 0
            ? 'No collections found.'
            : null;

    return (
        <PageFrame
            title="Collection Gallery"
            description="Visual browsing for saved prompts and images."
        >
            <div className="mb-6 space-y-4">
                <CollectionSearchBar
                    value={draftQuery}
                    onChange={setDraftQuery}
                    onSubmit={applySearch}
                    placeholder="Search in gallery by title"
                />
                <CollectionNav />
                <CollectionRealtimeControl />
            </div>

            {placeholderText ? (
                <Notice variant="neutral">{placeholderText}</Notice>
            ) : (
                <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            to="/collection/$id"
                            params={{ id: String(item.id) }}
                            className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-token-md border border-line bg-surface-base shadow-surface"
                        >
                            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 -translate-y-full bg-black/60 p-4 text-center text-sm font-semibold text-slate-100 transition group-hover:translate-y-0">
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
                    ))}
                </div>
            )}

            {items.length > 0 && totalPages > 1 ? (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            ) : null}

            {items.length > 0 ? (
                <p className="mt-2 text-xs text-ink-muted">
                    {totalItems} collections total
                </p>
            ) : null}

            {error ? (
                <Notice variant="error" className="mt-4">{error}</Notice>
            ) : null}
        </PageFrame>
    );
};
