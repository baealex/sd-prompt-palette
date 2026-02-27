import {
    Outlet,
    useLocation,
    useNavigate,
    useSearch,
} from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CollectionNav } from '~/components/domain/CollectionNav';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { CollectionSlideShowShortcut } from '~/components/domain/CollectionSlideShowShortcut';
import { PageFrame } from '~/components/domain/PageFrame';

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
    const query = useSearch({
        strict: false,
        select: (search) => {
            const queryValue = (search as Record<string, unknown>).query;
            return typeof queryValue === 'string' ? queryValue : '';
        },
    });

    const currentPath = useMemo(
        () => resolveCollectionViewPath(location.pathname),
        [location.pathname],
    );
    const pageMeta = useMemo(() => getPageMeta(currentPath), [currentPath]);
    const [draftQuery, setDraftQuery] = useState<string>(query);

    useEffect(() => {
        setDraftQuery(query);
    }, [query]);

    const applySearch = useCallback(() => {
        const nextQuery = draftQuery.trim();

        void navigate({
            to: currentPath,
            replace: true,
            resetScroll: false,
            search: (previousSearch) => {
                const nextSearch = {
                    ...(previousSearch as Record<string, unknown>),
                };

                if (nextQuery) {
                    nextSearch.query = nextQuery;
                } else {
                    delete nextSearch.query;
                }

                delete nextSearch.page;
                delete nextSearch.selected;

                return nextSearch;
            },
        });
    }, [currentPath, draftQuery, navigate]);

    return (
        <PageFrame title={pageMeta.title} description={pageMeta.description}>
            <div className="mb-6 space-y-4">
                <CollectionSearchBar
                    value={draftQuery}
                    onChange={setDraftQuery}
                    onSubmit={applySearch}
                    placeholder={pageMeta.searchPlaceholder}
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
