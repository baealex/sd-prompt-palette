import type { OrderRequest } from '~/api';

export type CollectionSort =
    | 'collection_added_desc'
    | 'collection_added_asc'
    | 'generated_at_desc'
    | 'generated_at_asc';

export interface CollectionSortOption {
    value: CollectionSort;
    label: string;
}

export const DEFAULT_COLLECTION_SORT: CollectionSort = 'collection_added_desc';

export const COLLECTION_SORT_OPTIONS: CollectionSortOption[] = [
    { value: 'collection_added_desc', label: 'Added to collection (newest)' },
    { value: 'collection_added_asc', label: 'Added to collection (oldest)' },
    { value: 'generated_at_desc', label: 'Generated date (newest)' },
    { value: 'generated_at_asc', label: 'Generated date (oldest)' },
];

const COLLECTION_SORT_VALUES = new Set<CollectionSort>(
    COLLECTION_SORT_OPTIONS.map((option) => option.value),
);

export const parseCollectionSort = (input: unknown): CollectionSort => {
    if (
        typeof input === 'string' &&
        COLLECTION_SORT_VALUES.has(input as CollectionSort)
    ) {
        return input as CollectionSort;
    }

    return DEFAULT_COLLECTION_SORT;
};

export const normalizeCollectionFilterText = (input: unknown): string => {
    if (typeof input !== 'string') {
        return '';
    }

    return input.trim();
};

export const resolveCollectionSortOrder = (
    sort: CollectionSort,
): Required<Pick<OrderRequest, 'order' | 'orderBy'>> => {
    switch (sort) {
        case 'collection_added_asc':
            return {
                orderBy: 'createdAt',
                order: 'asc',
            };
        case 'generated_at_desc':
            return {
                orderBy: 'generatedAt',
                order: 'desc',
            };
        case 'generated_at_asc':
            return {
                orderBy: 'generatedAt',
                order: 'asc',
            };
        case 'collection_added_desc':
        default:
            return {
                orderBy: 'createdAt',
                order: 'desc',
            };
    }
};

export const applyCollectionFilterSearch = (
    target: Record<string, unknown>,
    filters: {
        query: string;
        model: string;
        sort: CollectionSort;
    },
) => {
    if (filters.query) {
        target.query = filters.query;
    } else {
        delete target.query;
    }

    if (filters.model) {
        target.model = filters.model;
    } else {
        delete target.model;
    }

    if (filters.sort !== DEFAULT_COLLECTION_SORT) {
        target.sort = filters.sort;
    } else {
        delete target.sort;
    }
};

export const buildCollectionViewPath = (
    basePath: string,
    next: {
        query: string;
        model: string;
        sort: CollectionSort;
        page: number;
        selected?: number | null;
    },
) => {
    const params = new URLSearchParams();
    if (next.query) {
        params.set('query', next.query);
    }
    if (next.model) {
        params.set('model', next.model);
    }
    if (next.sort !== DEFAULT_COLLECTION_SORT) {
        params.set('sort', next.sort);
    }
    if (next.page > 1) {
        params.set('page', String(next.page));
    }
    if (next.selected && next.selected > 0) {
        params.set('selected', String(next.selected));
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
};
