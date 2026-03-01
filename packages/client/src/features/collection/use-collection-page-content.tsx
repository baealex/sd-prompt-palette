import { useMemo } from 'react';

import { CollectionBrowseView } from '~/components/domain/collection/views/CollectionBrowseView';
import { CollectionGalleryView } from '~/components/domain/collection/views/CollectionGalleryView';
import { CollectionListView } from '~/components/domain/collection/views/CollectionListView';
import type { CollectionView } from '~/features/collection/view-filter';

import type { CollectionPageItem } from './use-collection-page-data';

interface UseCollectionPageContentInput {
    view: CollectionView;
    items: CollectionPageItem[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    selectedId: number | null;
    queryErrorMessage: string | null;
    onPageChange: (nextPage: number) => void;
    onSelectedChange: (nextSelectedId: number | null) => void;
    onRefresh: () => Promise<unknown>;
}

export const useCollectionPageContent = ({
    view,
    items,
    loading,
    currentPage,
    totalPages,
    totalItems,
    selectedId,
    queryErrorMessage,
    onPageChange,
    onSelectedChange,
    onRefresh,
}: UseCollectionPageContentInput) => {
    return useMemo(() => {
        if (view === 'gallery') {
            return (
                <CollectionGalleryView
                    items={items}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    errorMessage={queryErrorMessage}
                    onPageChange={onPageChange}
                />
            );
        }

        if (view === 'browse') {
            return (
                <CollectionBrowseView
                    items={items}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    selectedId={selectedId}
                    errorMessage={queryErrorMessage}
                    onPageChange={onPageChange}
                    onSelectedChange={onSelectedChange}
                    onRefresh={onRefresh}
                />
            );
        }

        return (
            <CollectionListView
                items={items}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                errorMessage={queryErrorMessage}
                onPageChange={onPageChange}
                onRefresh={onRefresh}
            />
        );
    }, [
        currentPage,
        items,
        loading,
        onPageChange,
        onRefresh,
        onSelectedChange,
        queryErrorMessage,
        selectedId,
        totalItems,
        totalPages,
        view,
    ]);
};
