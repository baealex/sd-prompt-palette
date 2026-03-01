import { useSearch } from '@tanstack/react-router';

import {
    parseCollectionFilterState,
} from '~/features/collection/view-filter';

export const useShowcaseFilters = () => {
    return useSearch({
        strict: false,
        select: (search) =>
            parseCollectionFilterState(search as Record<string, unknown>),
    });
};
