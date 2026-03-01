import { Link, useSearch } from '@tanstack/react-router';

import { ImageIcon } from '~/icons';
import {
    normalizeCollectionFilterText,
    parseCollectionSort,
    DEFAULT_COLLECTION_SORT,
} from '~/features/collection/view-filter';

export const CollectionShowcaseShortcut = () => {
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

    const searchParams: Record<string, string> = {};
    if (filters.query) {
        searchParams.query = filters.query;
    }
    if (filters.model) {
        searchParams.model = filters.model;
    }
    if (filters.sort !== DEFAULT_COLLECTION_SORT) {
        searchParams.sort = filters.sort;
    }

    return (
        <Link
            to="/collection/showcase"
            search={searchParams}
            className="ui-focus-ring inline-flex h-11 items-center gap-1.5 rounded-token-md bg-surface-muted px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
            <ImageIcon width={14} height={14} />
            Showcase
        </Link>
    );
};
