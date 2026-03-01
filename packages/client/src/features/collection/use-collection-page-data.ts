import { useQuery } from '@tanstack/react-query';

import { getCollectionModelOptions, getCollections } from '~/api';
import { resolveCollectionSortOrder, type CollectionFilterState } from './view-filter';

import type { Collection } from '~/models/types';

export const COLLECTION_PAGE_LIMIT = 20;

export type CollectionPageItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;

const getLastPage = (total: number, limit: number) => {
    return Math.max(1, Math.ceil(total / limit));
};

interface UseCollectionPageDataInput extends CollectionFilterState {
    currentPage: number;
}

export const useCollectionPageData = ({
    query,
    model,
    searchBy,
    dateField,
    dateFrom,
    dateTo,
    sort,
    currentPage,
}: UseCollectionPageDataInput) => {
    const modelOptionsQuery = useQuery({
        queryKey: ['collections', 'model-options'] as const,
        queryFn: async () => {
            const response = await getCollectionModelOptions();
            return response.data.collectionModelOptions
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        },
    });

    const collectionsQuery = useQuery({
        queryKey: [
            'collections',
            query,
            model,
            searchBy,
            dateField,
            dateFrom,
            dateTo,
            sort,
            currentPage,
        ] as const,
        queryFn: async () => {
            const response = await getCollections({
                page: currentPage,
                limit: COLLECTION_PAGE_LIMIT,
                query,
                model,
                searchBy,
                dateField,
                dateFrom,
                dateTo,
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
            const lastPage = getLastPage(total, COLLECTION_PAGE_LIMIT);

            return {
                items: responseItems,
                total,
                lastPage,
            };
        },
        placeholderData: (previousData) => previousData,
    });

    const items: CollectionPageItem[] = collectionsQuery.data?.items ?? [];
    const loading = collectionsQuery.isPending;
    const totalPages = collectionsQuery.data?.lastPage ?? 1;
    const totalItems = collectionsQuery.data?.total ?? 0;
    const queryErrorMessage =
        collectionsQuery.error instanceof Error
            ? collectionsQuery.error.message
            : null;
    const modelOptionsError =
        modelOptionsQuery.error instanceof Error
            ? modelOptionsQuery.error.message
            : null;

    return {
        modelOptionsQuery,
        modelOptions: modelOptionsQuery.data ?? [],
        modelOptionsError,
        collectionsQuery,
        items,
        loading,
        totalPages,
        totalItems,
        queryErrorMessage,
    };
};
