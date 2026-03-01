import { useSearch } from '@tanstack/react-router';

import {
    normalizeCollectionFilterText,
    parseCollectionSort,
} from '~/features/collection/view-filter';

export const useShowcaseFilters = () => {
    return useSearch({
        strict: false,
        select: (search) => {
            const s = search as Record<string, unknown>;
            return {
                query: normalizeCollectionFilterText(s.query),
                model: normalizeCollectionFilterText(s.model),
                sort: parseCollectionSort(s.sort),
            };
        },
    });
};
