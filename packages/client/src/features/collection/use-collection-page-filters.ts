import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import type { CollectionDateField, CollectionSearchBy } from '~/api';
import {
    DEFAULT_COLLECTION_DATE_FIELD,
    DEFAULT_COLLECTION_SEARCH_BY,
    DEFAULT_COLLECTION_SORT,
    parseCollectionRouteSearch,
    parseCollectionSearchParams,
    resolveCollectionDateQuickPreset,
    type CollectionDateQuickPreset,
    type CollectionRouteSearch,
    type CollectionSearchParams,
    type CollectionSort,
    type CollectionView,
} from '~/features/collection/view-filter';

const areRouteSearchEqual = (
    left: CollectionRouteSearch,
    right: CollectionRouteSearch,
) => {
    return (
        left.query === right.query &&
        left.model === right.model &&
        left.searchBy === right.searchBy &&
        left.dateField === right.dateField &&
        left.dateFrom === right.dateFrom &&
        left.dateTo === right.dateTo &&
        left.sort === right.sort &&
        left.view === right.view &&
        left.page === right.page &&
        left.selected === right.selected
    );
};

interface UpdateOptions {
    force?: boolean;
}

export const useCollectionPageFilters = () => {
    const navigate = useNavigate();
    const searchState = useSearch({
        from: '/app-layout/collection',
        select: (search) =>
            parseCollectionRouteSearch(search as CollectionSearchParams),
    }) as CollectionRouteSearch;

    const {
        query,
        model,
        view,
        page: currentPage,
        selected: selectedId,
    } = searchState;

    const [draftQuery, setDraftQuery] = useState<string>(query);
    const [draftModel, setDraftModel] = useState<string>(model);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

    useEffect(() => {
        setDraftModel(model);
    }, [model]);

    const commitSearchState = useCallback(
        (nextState: CollectionRouteSearch, options?: UpdateOptions) => {
            if (!options?.force && areRouteSearchEqual(nextState, searchState)) {
                return;
            }

            void navigate({
                to: '/collection',
                replace: true,
                resetScroll: false,
                search: () =>
                    parseCollectionSearchParams(
                        nextState as unknown as Record<string, unknown>,
                    ),
            });
        },
        [navigate, searchState],
    );

    const updateSearch = useCallback(
        (patch: CollectionSearchParams, options?: UpdateOptions) => {
            const nextState = parseCollectionRouteSearch({
                ...searchState,
                ...patch,
            });
            commitSearchState(nextState, options);
        },
        [commitSearchState, searchState],
    );

    const updateFilterSearch = useCallback(
        (patch: CollectionSearchParams, options?: UpdateOptions) => {
            const nextState = parseCollectionRouteSearch({
                ...searchState,
                query: draftQuery,
                model: draftModel,
                ...patch,
                page: 1,
            });

            if (nextState.view !== 'browse') {
                nextState.selected = null;
            }

            commitSearchState(nextState, options);
        },
        [commitSearchState, draftModel, draftQuery, searchState],
    );

    const applySearch = useCallback(() => {
        updateFilterSearch({}, { force: true });
    }, [updateFilterSearch]);

    useEffect(() => {
        const normalizedDraftQuery = draftQuery.trim();
        if (normalizedDraftQuery === query) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            updateFilterSearch({ query: normalizedDraftQuery });
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [draftQuery, query, updateFilterSearch]);

    const handleSortChange = useCallback(
        (nextSort: CollectionSort) => {
            updateFilterSearch({ sort: nextSort });
        },
        [updateFilterSearch],
    );

    const handleModelChange = useCallback(
        (nextModel: string) => {
            setDraftModel(nextModel);
            updateFilterSearch({ model: nextModel });
        },
        [updateFilterSearch],
    );

    const handleSearchByChange = useCallback(
        (nextSearchBy: CollectionSearchBy) => {
            updateFilterSearch({ searchBy: nextSearchBy });
        },
        [updateFilterSearch],
    );

    const handleDateFieldChange = useCallback(
        (nextDateField: CollectionDateField) => {
            updateFilterSearch({ dateField: nextDateField });
        },
        [updateFilterSearch],
    );

    const handleDateFromChange = useCallback(
        (nextDateFrom: string) => {
            updateFilterSearch({ dateFrom: nextDateFrom });
        },
        [updateFilterSearch],
    );

    const handleDateToChange = useCallback(
        (nextDateTo: string) => {
            updateFilterSearch({ dateTo: nextDateTo });
        },
        [updateFilterSearch],
    );
    const handleDateRangeChange = useCallback(
        (nextDateFrom: string, nextDateTo: string) => {
            updateFilterSearch({ dateFrom: nextDateFrom, dateTo: nextDateTo });
        },
        [updateFilterSearch],
    );

    const handleDateQuickPreset = useCallback(
        (preset: CollectionDateQuickPreset) => {
            const nextDateRange = resolveCollectionDateQuickPreset(preset);
            updateFilterSearch(nextDateRange);
        },
        [updateFilterSearch],
    );

    const handleViewChange = useCallback(
        (nextView: CollectionView) => {
            updateFilterSearch({ view: nextView });
        },
        [updateFilterSearch],
    );

    const handlePageChange = useCallback(
        (nextPage: number) => {
            const normalizedPage = Math.max(1, Math.trunc(nextPage));
            updateSearch({
                page: normalizedPage,
                selected: view === 'browse' ? undefined : selectedId ?? undefined,
            });
        },
        [selectedId, updateSearch, view],
    );

    const handleBrowseSelectedChange = useCallback(
        (nextSelectedId: number | null) => {
            const normalizedSelectedId =
                typeof nextSelectedId === 'number' && nextSelectedId > 0
                    ? Math.trunc(nextSelectedId)
                    : null;

            if (normalizedSelectedId === selectedId) {
                return;
            }

            updateSearch({
                view: 'browse',
                page: currentPage,
                selected: normalizedSelectedId ?? undefined,
            });
        },
        [currentPage, selectedId, updateSearch],
    );

    const resetFilters = useCallback(() => {
        setDraftQuery('');
        setDraftModel('');

        updateFilterSearch(
            {
                query: '',
                model: '',
                searchBy: DEFAULT_COLLECTION_SEARCH_BY,
                dateField: DEFAULT_COLLECTION_DATE_FIELD,
                dateFrom: '',
                dateTo: '',
                sort: DEFAULT_COLLECTION_SORT,
            },
            { force: true },
        );
    }, [updateFilterSearch]);

    return {
        searchState,
        draftQuery,
        draftModel,
        setDraftQuery,
        applySearch,
        handleSortChange,
        handleModelChange,
        handleSearchByChange,
        handleDateFieldChange,
        handleDateFromChange,
        handleDateToChange,
        handleDateRangeChange,
        handleDateQuickPreset,
        handleViewChange,
        handlePageChange,
        handleBrowseSelectedChange,
        resetFilters,
    };
};
