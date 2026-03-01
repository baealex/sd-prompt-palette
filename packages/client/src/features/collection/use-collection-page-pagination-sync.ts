import { useEffect } from 'react';

interface UseCollectionPagePaginationSyncInput {
    currentPage: number;
    lastPage: number | undefined;
    onPageChange: (nextPage: number) => void;
}

export const useCollectionPagePaginationSync = ({
    currentPage,
    lastPage,
    onPageChange,
}: UseCollectionPagePaginationSyncInput) => {
    useEffect(() => {
        if (!lastPage || currentPage <= lastPage) {
            return;
        }

        onPageChange(lastPage);
    }, [currentPage, lastPage, onPageChange]);
};
