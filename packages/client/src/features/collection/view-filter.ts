import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import type {
    CollectionDateField,
    CollectionSearchBy,
    OrderRequest,
} from '~/api';

export type CollectionView = 'list' | 'gallery' | 'browse';
export type CollectionSort =
    | 'collection_added_desc'
    | 'collection_added_asc'
    | 'generated_at_desc'
    | 'generated_at_asc';
export type CollectionDateQuickPreset =
    | 'today'
    | 'yesterday'
    | 'week'
    | 'month'
    | 'all';

export interface CollectionSortOption {
    value: CollectionSort;
    label: string;
}

export interface CollectionDateFieldOption {
    value: CollectionDateField;
    label: string;
}

export interface CollectionFilterState {
    query: string;
    model: string;
    searchBy: CollectionSearchBy;
    dateField: CollectionDateField;
    dateFrom: string;
    dateTo: string;
    sort: CollectionSort;
}

export interface CollectionSearchParams {
    query?: string;
    model?: string;
    searchBy?: CollectionSearchBy;
    dateField?: CollectionDateField;
    dateFrom?: string;
    dateTo?: string;
    sort?: CollectionSort;
    view?: CollectionView;
    page?: number;
    selected?: number | null;
}

export interface CollectionRouteSearch extends CollectionFilterState {
    view: CollectionView;
    page: number;
    selected: number | null;
}

export const DEFAULT_COLLECTION_SORT: CollectionSort = 'collection_added_desc';
export const DEFAULT_COLLECTION_VIEW: CollectionView = 'list';
export const DEFAULT_COLLECTION_SEARCH_BY: CollectionSearchBy = 'title';
export const DEFAULT_COLLECTION_DATE_FIELD: CollectionDateField =
    'collection_added';

export const COLLECTION_SORT_OPTIONS: CollectionSortOption[] = [
    { value: 'collection_added_desc', label: 'Added to collection (newest)' },
    { value: 'collection_added_asc', label: 'Added to collection (oldest)' },
    { value: 'generated_at_desc', label: 'Generated date (newest)' },
    { value: 'generated_at_asc', label: 'Generated date (oldest)' },
];
export const COLLECTION_DATE_FIELD_OPTIONS: CollectionDateFieldOption[] = [
    { value: 'collection_added', label: 'Collection added date' },
    { value: 'generated_at', label: 'Image generated date' },
];

const COLLECTION_SORT_VALUES = new Set<CollectionSort>(
    COLLECTION_SORT_OPTIONS.map((option) => option.value),
);
const COLLECTION_VIEW_VALUES = new Set<CollectionView>([
    'list',
    'gallery',
    'browse',
]);
const COLLECTION_SEARCH_BY_VALUES = new Set<CollectionSearchBy>([
    'title',
    'prompt',
    'negative_prompt',
]);
const COLLECTION_DATE_FIELD_VALUES = new Set<CollectionDateField>(
    COLLECTION_DATE_FIELD_OPTIONS.map((option) => option.value),
);

export const parseCollectionView = (input: unknown): CollectionView => {
    if (
        typeof input === 'string' &&
        COLLECTION_VIEW_VALUES.has(input as CollectionView)
    ) {
        return input as CollectionView;
    }

    return DEFAULT_COLLECTION_VIEW;
};

export const parseCollectionSearchBy = (input: unknown): CollectionSearchBy => {
    if (
        typeof input === 'string' &&
        COLLECTION_SEARCH_BY_VALUES.has(input as CollectionSearchBy)
    ) {
        return input as CollectionSearchBy;
    }

    return DEFAULT_COLLECTION_SEARCH_BY;
};

export const parseCollectionDateField = (input: unknown): CollectionDateField => {
    if (
        typeof input === 'string' &&
        COLLECTION_DATE_FIELD_VALUES.has(input as CollectionDateField)
    ) {
        return input as CollectionDateField;
    }

    return DEFAULT_COLLECTION_DATE_FIELD;
};

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

export const normalizeCollectionDateTime = (input: unknown): string => {
    if (typeof input !== 'string') {
        return '';
    }

    return input.trim();
};

export const normalizeCollectionDateRange = (
    dateFrom: unknown,
    dateTo: unknown,
) => {
    let normalizedFrom = normalizeCollectionDateTime(dateFrom);
    let normalizedTo = normalizeCollectionDateTime(dateTo);
    const parsedFrom = normalizedFrom ? dayjs(normalizedFrom) : null;
    const parsedTo = normalizedTo ? dayjs(normalizedTo) : null;

    if (parsedFrom && !parsedFrom.isValid()) {
        normalizedFrom = '';
    }
    if (parsedTo && !parsedTo.isValid()) {
        normalizedTo = '';
    }

    if (
        normalizedFrom &&
        normalizedTo &&
        parsedFrom &&
        parsedTo &&
        parsedFrom.isValid() &&
        parsedTo.isValid() &&
        parsedFrom.isAfter(parsedTo)
    ) {
        [normalizedFrom, normalizedTo] = [normalizedTo, normalizedFrom];
    }

    return {
        dateFrom: normalizedFrom,
        dateTo: normalizedTo,
    };
};

export const parseCollectionFilterState = (
    search: Record<string, unknown>,
): CollectionFilterState => {
    const normalizedDateRange = normalizeCollectionDateRange(
        search.dateFrom,
        search.dateTo,
    );

    return {
        query: normalizeCollectionFilterText(search.query),
        model: normalizeCollectionFilterText(search.model),
        searchBy: parseCollectionSearchBy(search.searchBy),
        dateField: parseCollectionDateField(search.dateField),
        dateFrom: normalizedDateRange.dateFrom,
        dateTo: normalizedDateRange.dateTo,
        sort: parseCollectionSort(search.sort),
    };
};

const normalizeCollectionNumericParam = (input: unknown): number | null => {
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

export const parseCollectionPage = (input: unknown): number => {
    const parsed = normalizeCollectionNumericParam(input);
    if (!parsed || parsed <= 0) {
        return 1;
    }
    return Math.max(1, Math.trunc(parsed));
};

export const parseCollectionSelected = (input: unknown): number | null => {
    const parsed = normalizeCollectionNumericParam(input);
    if (!parsed || parsed <= 0) {
        return null;
    }
    return Math.trunc(parsed);
};

export const parseCollectionRouteSearch = (
    search: CollectionSearchParams,
): CollectionRouteSearch => {
    return {
        ...parseCollectionFilterState(search as Record<string, unknown>),
        view: parseCollectionView(search.view),
        page: parseCollectionPage(search.page),
        selected: parseCollectionSelected(search.selected),
    };
};

export const parseCollectionSearchParams = (
    search: Record<string, unknown>,
): CollectionSearchParams => {
    const normalized = parseCollectionRouteSearch(search as CollectionSearchParams);
    const normalizedDateRange = normalizeCollectionDateRange(
        normalized.dateFrom,
        normalized.dateTo,
    );
    const hasDateFilter =
        normalizedDateRange.dateFrom.length > 0 ||
        normalizedDateRange.dateTo.length > 0;

    const nextSearch: CollectionSearchParams = {};

    if (normalized.query) {
        nextSearch.query = normalized.query;
    }
    if (normalized.model) {
        nextSearch.model = normalized.model;
    }
    if (normalized.searchBy !== DEFAULT_COLLECTION_SEARCH_BY) {
        nextSearch.searchBy = normalized.searchBy;
    }
    if (hasDateFilter && normalized.dateField !== DEFAULT_COLLECTION_DATE_FIELD) {
        nextSearch.dateField = normalized.dateField;
    }
    if (normalizedDateRange.dateFrom) {
        nextSearch.dateFrom = normalizedDateRange.dateFrom;
    }
    if (normalizedDateRange.dateTo) {
        nextSearch.dateTo = normalizedDateRange.dateTo;
    }
    if (normalized.sort !== DEFAULT_COLLECTION_SORT) {
        nextSearch.sort = normalized.sort;
    }
    if (normalized.view !== DEFAULT_COLLECTION_VIEW) {
        nextSearch.view = normalized.view;
    }
    if (normalized.page > 1) {
        nextSearch.page = normalized.page;
    }
    if (normalized.view === 'browse' && normalized.selected) {
        nextSearch.selected = normalized.selected;
    }

    return nextSearch;
};

const formatDateTimeLocal = (value: Dayjs) => value.format('YYYY-MM-DDTHH:mm');

export const resolveCollectionDateQuickPreset = (
    preset: CollectionDateQuickPreset,
    referenceNow = new Date(),
) => {
    const now = dayjs(referenceNow);

    if (preset === 'all') {
        return {
            dateFrom: '',
            dateTo: '',
        };
    }

    if (preset === 'today') {
        return {
            dateFrom: formatDateTimeLocal(now.startOf('day')),
            dateTo: formatDateTimeLocal(now.endOf('day')),
        };
    }

    if (preset === 'yesterday') {
        const yesterday = now.subtract(1, 'day');
        return {
            dateFrom: formatDateTimeLocal(yesterday.startOf('day')),
            dateTo: formatDateTimeLocal(yesterday.endOf('day')),
        };
    }

    if (preset === 'week') {
        const start = now.subtract(7, 'day');
        return {
            dateFrom: formatDateTimeLocal(start),
            dateTo: formatDateTimeLocal(now),
        };
    }

    const start = now.subtract(1, 'month');
    return {
        dateFrom: formatDateTimeLocal(start),
        dateTo: formatDateTimeLocal(now),
    };
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
        searchBy: CollectionSearchBy;
        dateField: CollectionDateField;
        dateFrom: string;
        dateTo: string;
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

    if (filters.searchBy !== DEFAULT_COLLECTION_SEARCH_BY) {
        target.searchBy = filters.searchBy;
    } else {
        delete target.searchBy;
    }

    const normalizedDateRange = normalizeCollectionDateRange(
        filters.dateFrom,
        filters.dateTo,
    );
    const hasDateFilter =
        normalizedDateRange.dateFrom.length > 0 ||
        normalizedDateRange.dateTo.length > 0;

    if (normalizedDateRange.dateFrom) {
        target.dateFrom = normalizedDateRange.dateFrom;
    } else {
        delete target.dateFrom;
    }

    if (normalizedDateRange.dateTo) {
        target.dateTo = normalizedDateRange.dateTo;
    } else {
        delete target.dateTo;
    }

    if (hasDateFilter && filters.dateField !== DEFAULT_COLLECTION_DATE_FIELD) {
        target.dateField = filters.dateField;
    } else {
        delete target.dateField;
    }

    if (filters.sort !== DEFAULT_COLLECTION_SORT) {
        target.sort = filters.sort;
    } else {
        delete target.sort;
    }
};

export const applyCollectionViewSearch = (
    target: Record<string, unknown>,
    view: CollectionView,
) => {
    if (view !== DEFAULT_COLLECTION_VIEW) {
        target.view = view;
    } else {
        delete target.view;
    }

    if (view !== 'browse') {
        delete target.selected;
    }
};

export const buildCollectionPath = (
    next: {
        view: CollectionView;
        query: string;
        model: string;
        searchBy: CollectionSearchBy;
        dateField: CollectionDateField;
        dateFrom: string;
        dateTo: string;
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
    if (next.searchBy !== DEFAULT_COLLECTION_SEARCH_BY) {
        params.set('searchBy', next.searchBy);
    }
    const normalizedDateRange = normalizeCollectionDateRange(
        next.dateFrom,
        next.dateTo,
    );
    const hasDateFilter =
        normalizedDateRange.dateFrom.length > 0 ||
        normalizedDateRange.dateTo.length > 0;
    if (
        hasDateFilter &&
        next.dateField !== DEFAULT_COLLECTION_DATE_FIELD
    ) {
        params.set('dateField', next.dateField);
    }
    if (normalizedDateRange.dateFrom) {
        params.set('dateFrom', normalizedDateRange.dateFrom);
    }
    if (normalizedDateRange.dateTo) {
        params.set('dateTo', normalizedDateRange.dateTo);
    }
    if (next.sort !== DEFAULT_COLLECTION_SORT) {
        params.set('sort', next.sort);
    }
    if (next.view !== DEFAULT_COLLECTION_VIEW) {
        params.set('view', next.view);
    }
    if (next.page > 1) {
        params.set('page', String(next.page));
    }
    if (next.view === 'browse' && next.selected && next.selected > 0) {
        params.set('selected', String(next.selected));
    }

    const queryString = params.toString();
    return queryString ? `/collection?${queryString}` : '/collection';
};
