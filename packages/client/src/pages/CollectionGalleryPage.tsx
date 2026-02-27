import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { getCollections } from '~/api';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { Image } from '~/components/domain/Image';
import { PageFrame } from '~/components/domain/PageFrame';
import type { Collection } from '~/models/types';
import { usePathStore } from '~/state/path-store';

const LIMIT = 20;

type CollectionGalleryItem = Pick<Collection, 'id' | 'title' | 'image'>;
interface CollectionGalleryChunk {
    items: CollectionGalleryItem[];
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

export const CollectionGalleryPage = () => {
    const { setPath } = usePathStore();

    const [query, setQuery] = useState<string>(getInitialQuery);
    const [draftQuery, setDraftQuery] = useState<string>(getInitialQuery);

    useEffect(() => {
        setPath('collection', '/collection/gallery');
    }, [setPath]);

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
        window.history.replaceState(null, '', nextSearch ? `/collection/gallery?${nextSearch}` : '/collection/gallery');
    };

    const placeholderText = loading
        ? 'Loading collections...'
        : items.length === 0
            ? 'No collections found.'
            : null;

    return (
        <PageFrame
            title="Collection Gallery"
            description="Masonry-style browsing with query filter."
        >
            <CollectionNav />

            <form onSubmit={handleSearchSubmit} className="mx-auto mb-4 max-w-sm">
                <input
                    type="text"
                    value={draftQuery}
                    onChange={(event) => setDraftQuery(event.target.value)}
                    placeholder="Search"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                />
            </form>

            {placeholderText ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{placeholderText}</p>
            ) : (
                <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={`/collection/${item.id}`}
                            className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-lg border border-slate-200 bg-white"
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
                        </a>
                    ))}
                </div>
            )}

            {loadingMore ? (
                <p className="mt-4 text-center text-sm text-slate-500">Loading more...</p>
            ) : null}

            {error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}
        </PageFrame>
    );
};
