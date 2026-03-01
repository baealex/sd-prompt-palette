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
import { CollectionShowcaseShortcut } from '~/components/domain/CollectionShowcaseShortcut';
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

    const applyFilters = useCallback(
        (
            next: {
                query: string;
                model: string;
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
                next.sort !== sort;

            if (!shouldApply) {
                return;
            }

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
                        sort: next.sort,
                    });
                    delete nextSearch.page;
                    delete nextSearch.selected;

                    return nextSearch;
                },
            });
        },
        [currentPath, model, navigate, query, sort],
    );

    const applySearch = useCallback(() => {
        applyFilters(
            {
                query: draftQuery,
                model: draftModel,
                sort,
            },
            { force: true },
        );
    }, [applyFilters, draftModel, draftQuery, sort]);

    useEffect(() => {
        const normalizedDraftQuery = draftQuery.trim();
        if (normalizedDraftQuery === query) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            applyFilters({
                query: normalizedDraftQuery,
                model: draftModel,
                sort,
            });
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [applyFilters, draftModel, draftQuery, query, sort]);

    const handleSortChange = useCallback(
        (nextSort: CollectionSort) => {
            applyFilters({
                query: draftQuery,
                model: draftModel,
                sort: nextSort,
            });
        },
        [applyFilters, draftModel, draftQuery],
    );

    const handleModelChange = useCallback(
        (nextModel: string) => {
            setDraftModel(nextModel);
            applyFilters({
                query: draftQuery,
                model: nextModel,
                sort,
            });
        },
        [applyFilters, draftQuery, sort],
    );

    const resetFilters = useCallback(() => {
        setDraftQuery('');
        setDraftModel('');

        applyFilters(
            {
                query: '',
                model: '',
                sort: DEFAULT_COLLECTION_SORT,
            },
            { force: true },
        );
    }, [applyFilters]);

    return (
        <PageFrame title={pageMeta.title} description={pageMeta.description}>
            <div className="mb-4 overflow-hidden rounded-token-lg border-2 border-brand-200 bg-surface-base shadow-surface">
                <CollectionSearchBar
                    value={draftQuery}
                    onChange={setDraftQuery}
                    onSubmit={applySearch}
                    placeholder={pageMeta.searchPlaceholder}
                    embedded
                />
                <CollectionFilterBar
                    sort={sort}
                    model={draftModel}
                    modelOptions={modelOptionsQuery.data ?? []}
                    loadingModelOptions={modelOptionsQuery.isPending}
                    onSortChange={handleSortChange}
                    onModelChange={handleModelChange}
                    onReset={resetFilters}
                    embedded
                />
            </div>
            <div className="mb-4">
                <CollectionRealtimeControl />
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <CollectionNav />
                <CollectionShowcaseShortcut />
            </div>

            <Outlet />
        </PageFrame>
    );
};
