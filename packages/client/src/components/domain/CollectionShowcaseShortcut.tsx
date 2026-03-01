import { Link, useSearch } from '@tanstack/react-router';

import { ImageIcon } from '~/icons';
import {
    DEFAULT_COLLECTION_DATE_FIELD,
    DEFAULT_COLLECTION_SEARCH_BY,
    DEFAULT_COLLECTION_SORT,
    parseCollectionFilterState,
} from '~/features/collection/view-filter';

export const CollectionShowcaseShortcut = () => {
    const filters = useSearch({
        strict: false,
        select: (search) =>
            parseCollectionFilterState(search as Record<string, unknown>),
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
    if (filters.searchBy !== DEFAULT_COLLECTION_SEARCH_BY) {
        searchParams.searchBy = filters.searchBy;
    }
    if (
        (filters.dateFrom || filters.dateTo) &&
        filters.dateField !== DEFAULT_COLLECTION_DATE_FIELD
    ) {
        searchParams.dateField = filters.dateField;
    }
    if (filters.dateFrom) {
        searchParams.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
        searchParams.dateTo = filters.dateTo;
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
