import { useEffect, useMemo, useState } from 'react';

import { getCategories, getCollections, getLiveStatus } from '~/api';
import { getPageRange } from '~/modules/page';

interface HomeOverviewState {
    loading: boolean;
    error: string | null;
    categoryCount: number;
    collectionTotal: number;
    liveEnabled: boolean | null;
    samplePageRange: number[];
}

const INITIAL_STATE: HomeOverviewState = {
    loading: true,
    error: null,
    categoryCount: 0,
    collectionTotal: 0,
    liveEnabled: null,
    samplePageRange: [],
};

export function useHomeOverview() {
    const [state, setState] = useState<HomeOverviewState>(INITIAL_STATE);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setState((prev) => ({
                ...prev,
                loading: true,
                error: null,
            }));

            try {
                const [categoriesResponse, collectionsResponse, liveStatusResponse] = await Promise.all([
                    getCategories(),
                    getCollections({ page: 1, limit: 12 }),
                    getLiveStatus(),
                ]);

                if (cancelled) {
                    return;
                }

                const categoryCount = categoriesResponse.data.allCategories.length;
                const collectionTotal = collectionsResponse.data.allCollections.pagination.total;
                const totalPages = Math.max(1, Math.ceil(collectionTotal / 12));
                const samplePageRange = getPageRange({
                    currentPage: 1,
                    totalPages,
                    visiblePages: 5,
                });

                setState({
                    loading: false,
                    error: null,
                    categoryCount,
                    collectionTotal,
                    liveEnabled: liveStatusResponse.data.enabled ?? null,
                    samplePageRange,
                });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to load overview',
                }));
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, []);

    return useMemo(() => state, [state]);
}
