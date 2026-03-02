import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { getCollectionModelOptions, getCollections } from '~/api';
import { toCollectionSummaryItems } from '~/entities/collection/mapper';
import { collectionQueryKeys } from '~/features/collection/query-keys';
import { resolveCollectionSortOrder, type CollectionFilterState } from './view-filter';

import type { Collection } from '~/models/types';

export const COLLECTION_PAGE_LIMIT = 20;

export type CollectionPageItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;

const EMPTY_COLLECTION_ITEMS: CollectionPageItem[] = [];
const EMPTY_MODEL_OPTIONS: string[] = [];

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
    const queryClient = useQueryClient();
    const collectionsQueryKey = useMemo(
        () =>
            collectionQueryKeys.list({
                query,
                model,
                searchBy,
                dateField,
                dateFrom,
                dateTo,
                sort,
                page: currentPage,
                limit: COLLECTION_PAGE_LIMIT,
            }),
        [
            currentPage,
            dateField,
            dateFrom,
            dateTo,
            model,
            query,
            searchBy,
            sort,
        ],
    );

    const modelOptionsQuery = useQuery({
        queryKey: collectionQueryKeys.modelOptions(),
        queryFn: async () => {
            const response = await getCollectionModelOptions();
            return response.data.collectionModelOptions
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        },
    });

    const collectionsQuery = useQuery({
        queryKey: collectionsQueryKey,
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

            const responseItems = toCollectionSummaryItems(
                response.data.allCollections.collections,
            );
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

    const refreshCollections = useCallback(async () => {
        await queryClient.refetchQueries({
            queryKey: collectionsQueryKey,
            exact: true,
        });
    }, [collectionsQueryKey, queryClient]);

    const items = collectionsQuery.data?.items ?? EMPTY_COLLECTION_ITEMS;
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
        modelOptions: modelOptionsQuery.data ?? EMPTY_MODEL_OPTIONS,
        modelOptionsError,
        collectionsQuery,
        items,
        loading,
        totalPages,
        totalItems,
        queryErrorMessage,
        refreshCollections,
    };
};
