import { useQuery } from '@tanstack/react-query';
import {
    Outlet,
    useLocation,
    useNavigate,
    useSearch,
} from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCollectionModelOptions } from '~/api';
import { CollectionFilterBar } from '~/components/domain/CollectionFilterBar';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { CollectionSlideShowShortcut } from '~/components/domain/CollectionSlideShowShortcut';
import { PageFrame } from '~/components/domain/PageFrame';
import {
    DEFAULT_COLLECTION_SORT,
    applyCollectionFilterSearch,
    normalizeCollectionFilterText,
    parseCollectionSort,
    type CollectionSort,
} from '~/features/collection/view-filter';

type CollectionViewPath =
    | '/collection'
    | '/collection/gallery'
    | '/collection/browse';

interface CollectionPageMeta {
    title: string;
    description: string;
    searchPlaceholder: string;
}

const resolveCollectionViewPath = (pathname: string): CollectionViewPath => {
    if (pathname.startsWith('/collection/browse')) {
        return '/collection/browse';
    }

    if (pathname.startsWith('/collection/gallery')) {
        return '/collection/gallery';
    }

    return '/collection';
};

const getPageMeta = (path: CollectionViewPath): CollectionPageMeta => {
    if (path === '/collection/gallery') {
        return {
            title: 'Collection Gallery',
            description: 'Visual browsing for saved prompts and images.',
            searchPlaceholder: 'Search in gallery by title',
        };
    }

    if (path === '/collection/browse') {
        return {
            title: 'Collection Browse',
            description:
                'Pick from the thumbnail gallery on the left and inspect the selected image in detail on the right.',
            searchPlaceholder: 'Search title, prompt, or negative prompt',
        };
    }

    return {
        title: 'Collection',
        description: 'Browse, search, and manage saved prompts.',
        searchPlaceholder: 'Search title, prompt, or negative prompt',
    };
};

export const CollectionViewLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const filters = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            const modelValue = (search as Record<string, unknown>).model;
            const sortValue = (search as Record<string, unknown>).sort;
            return {
                query: normalizeCollectionFilterText(queryValue),
                model: normalizeCollectionFilterText(modelValue),
                sort: parseCollectionSort(sortValue),
            };
        },
    });
    const query = filters.query;
    const model = filters.model;
    const sort = filters.sort;
    const modelOptionsQuery = useQuery({
        queryKey: ['collections', 'model-options'] as const,
        queryFn: async () => {
            const response = await getCollectionModelOptions();
            return response.data.collectionModelOptions
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        },
    });

    const currentPath = useMemo(
        () => resolveCollectionViewPath(location.pathname),
        [location.pathname],
    );
    const pageMeta = useMemo(() => getPageMeta(currentPath), [currentPath]);
    const [draftQuery, setDraftQuery] = useState<string>(query);
    const [draftModel, setDraftModel] = useState<string>(model);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

    useEffect(() => {
        setDraftModel(model);
    }, [model]);

    const applySearch = useCallback(() => {
        const nextQuery = draftQuery.trim();
        const nextModel = draftModel.trim();

        void navigate({
            to: currentPath,
            replace: true,
            resetScroll: false,
            search: (previousSearch) => {
                const nextSearch = {
                    ...(previousSearch as Record<string, unknown>),
                };

                applyCollectionFilterSearch(nextSearch, {
                    query: nextQuery,
                    model: nextModel,
                    sort,
                });
                delete nextSearch.page;
                delete nextSearch.selected;

                return nextSearch;
            },
        });
    }, [currentPath, draftModel, draftQuery, navigate, sort]);

    const handleSortChange = useCallback(
        (nextSort: CollectionSort) => {
            void navigate({
                to: currentPath,
                replace: true,
                resetScroll: false,
                search: (previousSearch) => {
                    const nextSearch = {
                        ...(previousSearch as Record<string, unknown>),
                    };
                    applyCollectionFilterSearch(nextSearch, {
                        query,
                        model,
                        sort: nextSort,
                    });
                    delete nextSearch.page;
                    delete nextSearch.selected;
                    return nextSearch;
                },
            });
        },
        [currentPath, model, navigate, query],
    );

    const resetFilters = useCallback(() => {
        setDraftQuery('');
        setDraftModel('');

        void navigate({
            to: currentPath,
            replace: true,
            resetScroll: false,
            search: (previousSearch) => {
                const nextSearch = {
                    ...(previousSearch as Record<string, unknown>),
                };
                applyCollectionFilterSearch(nextSearch, {
                    query: '',
                    model: '',
                    sort: DEFAULT_COLLECTION_SORT,
                });
                delete nextSearch.page;
                delete nextSearch.selected;
                return nextSearch;
            },
        });
    }, [currentPath, navigate]);

    return (
        <PageFrame title={pageMeta.title} description={pageMeta.description}>
            <div className="mb-6 space-y-4">
                <CollectionSearchBar
                    value={draftQuery}
                    onChange={setDraftQuery}
                    onSubmit={applySearch}
                    placeholder={pageMeta.searchPlaceholder}
                />
                <CollectionFilterBar
                    sort={sort}
                    model={draftModel}
                    modelOptions={modelOptionsQuery.data ?? []}
                    loadingModelOptions={modelOptionsQuery.isPending}
                    onSortChange={handleSortChange}
                    onModelChange={setDraftModel}
                    onApply={applySearch}
                    onReset={resetFilters}
                />
                <CollectionRealtimeControl />
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <CollectionNav />
                <CollectionSlideShowShortcut />
            </div>

            <Outlet />
        </PageFrame>
    );
};
