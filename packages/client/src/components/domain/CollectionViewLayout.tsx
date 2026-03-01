import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCollectionModelOptions } from '~/api';
import { CollectionFilterBar } from '~/components/domain/CollectionFilterBar';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { CollectionShowcaseShortcut } from '~/components/domain/CollectionShowcaseShortcut';
import { PageFrame } from '~/components/domain/PageFrame';
import { Card } from '~/components/ui/Card';
import { CollectionBrowsePage } from '~/pages/CollectionBrowsePage';
import { CollectionGalleryPage } from '~/pages/CollectionGalleryPage';
import { CollectionListPage } from '~/pages/CollectionListPage';
import {
    DEFAULT_COLLECTION_SEARCH_BY,
    DEFAULT_COLLECTION_SORT,
    applyCollectionFilterSearch,
    applyCollectionViewSearch,
    normalizeCollectionFilterText,
    parseCollectionSearchBy,
    parseCollectionSort,
    parseCollectionView,
    type CollectionSort,
    type CollectionView,
} from '~/features/collection/view-filter';
import type { CollectionSearchBy } from '~/api';

const COLLECTION_PAGE_META = {
    title: 'Collection',
    description: 'Browse, search, and manage saved prompts.',
    searchPlaceholder: 'Search title, prompt, or negative prompt',
} as const;

export const CollectionViewLayout = () => {
    const navigate = useNavigate();
    const filters = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            const modelValue = (search as Record<string, unknown>).model;
            const sortValue = (search as Record<string, unknown>).sort;
            const viewValue = (search as Record<string, unknown>).view;
            const searchByValue = (search as Record<string, unknown>).searchBy;
            return {
                query: normalizeCollectionFilterText(queryValue),
                model: normalizeCollectionFilterText(modelValue),
                sort: parseCollectionSort(sortValue),
                view: parseCollectionView(viewValue),
                searchBy: parseCollectionSearchBy(searchByValue),
            };
        },
    });
    const query = filters.query;
    const model = filters.model;
    const sort = filters.sort;
    const view = filters.view;
    const searchBy = filters.searchBy;
    const modelOptionsQuery = useQuery({
        queryKey: ['collections', 'model-options'] as const,
        queryFn: async () => {
            const response = await getCollectionModelOptions();
            return response.data.collectionModelOptions
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        },
    });
    const modelOptionsError =
        modelOptionsQuery.error instanceof Error
            ? modelOptionsQuery.error.message
            : null;

    const [draftQuery, setDraftQuery] = useState<string>(query);
    const [draftModel, setDraftModel] = useState<string>(model);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

    useEffect(() => {
        setDraftModel(model);
    }, [model]);

    const applyFilters = useCallback(
        (
            next: {
                view: CollectionView;
                query: string;
                model: string;
                searchBy: CollectionSearchBy;
                sort: CollectionSort;
            },
            options?: { force?: boolean },
        ) => {
            const nextQuery = next.query.trim();
            const nextModel = next.model.trim();
            const shouldApply =
                options?.force ||
                nextQuery !== query ||
                nextModel !== model ||
                next.searchBy !== searchBy ||
                next.sort !== sort ||
                next.view !== view;

            if (!shouldApply) {
                return;
            }

            void navigate({
                to: '/collection',
                replace: true,
                resetScroll: false,
                search: (previousSearch) => {
                    const nextSearch = {
                        ...(previousSearch as Record<string, unknown>),
                    };

                    applyCollectionFilterSearch(nextSearch, {
                        query: nextQuery,
                        model: nextModel,
                        searchBy: next.searchBy,
                        sort: next.sort,
                    });
                    applyCollectionViewSearch(nextSearch, next.view);
                    delete nextSearch.page;

                    if (next.view !== 'browse') {
                        delete nextSearch.selected;
                    }

                    return nextSearch;
                },
            });
        },
        [model, navigate, query, searchBy, sort, view],
    );

    const applySearch = useCallback(() => {
        applyFilters(
            {
                view,
                query: draftQuery,
                model: draftModel,
                searchBy,
                sort,
            },
            { force: true },
        );
    }, [applyFilters, draftModel, draftQuery, searchBy, sort, view]);

    useEffect(() => {
        const normalizedDraftQuery = draftQuery.trim();
        if (normalizedDraftQuery === query) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            applyFilters({
                view,
                query: normalizedDraftQuery,
                model: draftModel,
                searchBy,
                sort,
            });
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [applyFilters, draftModel, draftQuery, query, searchBy, sort, view]);

    const handleSortChange = useCallback(
        (nextSort: CollectionSort) => {
            applyFilters({
                view,
                query: draftQuery,
                model: draftModel,
                searchBy,
                sort: nextSort,
            });
        },
        [applyFilters, draftModel, draftQuery, searchBy, view],
    );

    const handleModelChange = useCallback(
        (nextModel: string) => {
            setDraftModel(nextModel);
            applyFilters({
                view,
                query: draftQuery,
                model: nextModel,
                searchBy,
                sort,
            });
        },
        [applyFilters, draftQuery, searchBy, sort, view],
    );

    const handleSearchByChange = useCallback(
        (nextSearchBy: CollectionSearchBy) => {
            applyFilters({
                view,
                query: draftQuery,
                model: draftModel,
                searchBy: nextSearchBy,
                sort,
            });
        },
        [applyFilters, draftModel, draftQuery, sort, view],
    );

    const handleViewChange = useCallback(
        (nextView: CollectionView) => {
            applyFilters({
                view: nextView,
                query: draftQuery,
                model: draftModel,
                searchBy,
                sort,
            });
        },
        [applyFilters, draftModel, draftQuery, searchBy, sort],
    );

    const resetFilters = useCallback(() => {
        setDraftQuery('');
        setDraftModel('');

        applyFilters(
            {
                view,
                query: '',
                model: '',
                searchBy: DEFAULT_COLLECTION_SEARCH_BY,
                sort: DEFAULT_COLLECTION_SORT,
            },
            { force: true },
        );
    }, [applyFilters, view]);

    const content = useMemo(() => {
        if (view === 'gallery') {
            return <CollectionGalleryPage />;
        }
        if (view === 'browse') {
            return <CollectionBrowsePage />;
        }
        return <CollectionListPage />;
    }, [view]);

    return (
        <PageFrame
            title={COLLECTION_PAGE_META.title}
            description={COLLECTION_PAGE_META.description}
        >
            <Card
                as="section"
                padding="none"
                emphasis="brandGlow"
                className="mb-4 overflow-hidden"
            >
                <CollectionSearchBar
                    value={draftQuery}
                    searchBy={searchBy}
                    onChange={setDraftQuery}
                    onSearchByChange={handleSearchByChange}
                    onSubmit={applySearch}
                    placeholder={COLLECTION_PAGE_META.searchPlaceholder}
                    embedded
                />
                <CollectionFilterBar
                    sort={sort}
                    model={draftModel}
                    modelOptions={modelOptionsQuery.data ?? []}
                    loadingModelOptions={modelOptionsQuery.isPending}
                    modelOptionsError={modelOptionsError}
                    onSortChange={handleSortChange}
                    onModelChange={handleModelChange}
                    onReset={resetFilters}
                    embedded
                />
            </Card>
            <div className="mb-4">
                <CollectionRealtimeControl />
            </div>
            <Card as="section" padding="sm" className="mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CollectionNav view={view} onViewChange={handleViewChange} />
                    <CollectionShowcaseShortcut />
                </div>
            </Card>

            {content}
        </PageFrame>
    );
};
