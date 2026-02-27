import { useInfiniteQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { getCollections } from '~/api';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { Image } from '~/components/domain/Image';
import { PageFrame } from '~/components/domain/PageFrame';
import { Notice } from '~/components/ui/Notice';
import type { Collection } from '~/models/types';
import { usePathStore } from '~/state/path-store';

const LIMIT = 20;

type CollectionGalleryItem = Pick<Collection, 'id' | 'title' | 'image'>;
interface CollectionGalleryChunk {
    items: CollectionGalleryItem[];
    page: number;
    lastPage: number;
}

const getLastPage = (total: number, limit: number) => {
    return Math.max(1, Math.ceil(total / limit));
};

export const CollectionGalleryPage = () => {
    const navigate = useNavigate();
    const { setPath } = usePathStore();
    const query = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            return typeof queryValue === 'string' ? queryValue : '';
        },
    });
    const [draftQuery, setDraftQuery] = useState<string>(query);

    useEffect(() => {
        setPath('collection', '/collection/gallery');
    }, [setPath]);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

    const collectionsQuery = useInfiniteQuery({
        queryKey: ['collections', 'gallery', query] as const,
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const response = await getCollections({
                page: pageParam,
                limit: LIMIT,
                query,
            });

            const responseCollections = response.data.allCollections.collections.map((collection) => ({
                id: collection.id,
                title: collection.title,
                image: collection.image,
            }));
            const responseLastPage = getLastPage(response.data.allCollections.pagination.total, LIMIT);

            return {
                items: responseCollections,
                page: pageParam,
                lastPage: responseLastPage,
            } satisfies CollectionGalleryChunk;
        },
        getNextPageParam: (lastChunk) => (lastChunk.page < lastChunk.lastPage ? lastChunk.page + 1 : undefined),
    });

    const items = collectionsQuery.data?.pages.flatMap((chunk) => chunk.items) ?? [];
    const loading = collectionsQuery.isPending;
    const loadingMore = collectionsQuery.isFetchingNextPage;
    const hasNextPage = collectionsQuery.hasNextPage;
    const fetchNextPage = collectionsQuery.fetchNextPage;
    const error = collectionsQuery.error instanceof Error ? collectionsQuery.error.message : null;

    useEffect(() => {
        const handleScroll = () => {
            const reachedBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

            if (!hasNextPage || !reachedBottom || loading || loadingMore) {
                return;
            }

            void fetchNextPage();
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [fetchNextPage, hasNextPage, loading, loadingMore]);

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
                return nextSearch;
            },
        });
    }, [draftQuery, navigate]);

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

            {loadingMore ? (
                <Notice variant="neutral" className="mt-4 text-center">Loading more...</Notice>
            ) : null}

            {error ? (
                <Notice variant="error" className="mt-4">{error}</Notice>
            ) : null}
        </PageFrame>
    );
};
