import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { getCollections } from '~/api';
import { resolveCollectionSortOrder } from '~/features/collection/view-filter';
import { useShowcaseFilters } from './use-showcase-filters';

const PAGE_SIZE = 20;

export const useShowcaseInfinite = (themeKey: string) => {
    const { query, model, sort } = useShowcaseFilters();

    const result = useInfiniteQuery({
        queryKey: ['collections', `showcase-${themeKey}`, query, model, sort],
        queryFn: async ({ pageParam }) => {
            const response = await getCollections({
                page: pageParam,
                limit: PAGE_SIZE,
                query,
                model,
                ...resolveCollectionSortOrder(sort),
            });
            return response.data.allCollections.collections.map((item) => ({
                id: item.id,
                title: item.title,
                prompt: item.prompt,
                negativePrompt: item.negativePrompt,
                image: item.image,
            }));
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.length < PAGE_SIZE) {
                return undefined;
            }
            return lastPageParam + 1;
        },
    });

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            if (
                entries[0]?.isIntersecting &&
                result.hasNextPage &&
                !result.isFetchingNextPage
            ) {
                void result.fetchNextPage();
            }
        });

        observer.observe(el);
        return () => {
            observer.disconnect();
        };
    }, [result.hasNextPage, result.isFetchingNextPage, result.fetchNextPage]);

    const collections = result.data?.pages.flat() ?? [];

    return {
        collections,
        sentinelRef,
        loading: result.isPending,
        isFetchingNextPage: result.isFetchingNextPage,
        hasNextPage: result.hasNextPage,
    };
};
