import type { CollectionDateField, CollectionSearchBy } from '~/api';

import type { CollectionSort } from './view-filter';

interface CollectionFilterKeyInput {
    query: string;
    model: string;
    searchBy: CollectionSearchBy;
    dateField: CollectionDateField;
    dateFrom: string;
    dateTo: string;
    sort: CollectionSort;
}

interface CollectionListKeyInput extends CollectionFilterKeyInput {
    page: number;
    limit: number;
}

interface CollectionShowcaseKeyInput extends CollectionFilterKeyInput {
    theme: string;
    page?: number;
    limit?: number;
}

const COLLECTIONS_KEY = 'collections';

export const collectionQueryKeys = {
    all: () => [COLLECTIONS_KEY] as const,
    modelOptions: () => [COLLECTIONS_KEY, 'model-options'] as const,
    listRoot: () => [COLLECTIONS_KEY, 'list'] as const,
    list: ({
        query,
        model,
        searchBy,
        dateField,
        dateFrom,
        dateTo,
        sort,
        page,
        limit,
    }: CollectionListKeyInput) =>
        [
            COLLECTIONS_KEY,
            'list',
            query,
            model,
            searchBy,
            dateField,
            dateFrom,
            dateTo,
            sort,
            page,
            limit,
        ] as const,
    showcaseRoot: () => [COLLECTIONS_KEY, 'showcase'] as const,
    showcase: ({
        theme,
        query,
        model,
        searchBy,
        dateField,
        dateFrom,
        dateTo,
        sort,
        page = 0,
        limit = 0,
    }: CollectionShowcaseKeyInput) =>
        [
            COLLECTIONS_KEY,
            'showcase',
            theme,
            query,
            model,
            searchBy,
            dateField,
            dateFrom,
            dateTo,
            sort,
            page,
            limit,
        ] as const,
};
