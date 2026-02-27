import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCategories, updateCategoryOrder, updateKeywordOrder } from '~/api';

import type { HomeCategory } from './types';

const sortCategories = (categories: HomeCategory[]) => [...categories].sort((left, right) => left.order - right.order);

interface HomeBoardState {
    categories: HomeCategory[];
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const INITIAL_STATE: HomeBoardState = {
    categories: [],
    loading: true,
    saving: false,
    error: null,
};

export const useHomeBoard = () => {
    const [state, setState] = useState<HomeBoardState>(INITIAL_STATE);

    const refresh = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            const response = await getCategories();
            setState((prev) => ({
                ...prev,
                loading: false,
                error: null,
                categories: sortCategories(response.data.allCategories),
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load categories',
            }));
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const reorderCategory = useCallback(async (activeCategoryId: number, overCategoryId: number) => {
        if (activeCategoryId === overCategoryId) {
            return;
        }

        const current = state.categories;
        const oldIndex = current.findIndex((category) => category.id === activeCategoryId);
        const newIndex = current.findIndex((category) => category.id === overCategoryId);

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        const optimistic = arrayMove(current, oldIndex, newIndex).map((category, index) => ({
            ...category,
            order: index + 1,
        }));

        setState((prev) => ({
            ...prev,
            categories: optimistic,
            saving: true,
            error: null,
        }));

        try {
            await updateCategoryOrder({
                id: activeCategoryId,
                order: newIndex + 1,
            });
            await refresh();
        } catch (error) {
            setState((prev) => ({
                ...prev,
                saving: false,
                error: error instanceof Error ? error.message : 'Failed to reorder category',
            }));
            await refresh();
        } finally {
            setState((prev) => ({
                ...prev,
                saving: false,
            }));
        }
    }, [refresh, state.categories]);

    const reorderKeyword = useCallback(async (categoryId: number, activeKeywordId: number, overKeywordId: number) => {
        if (activeKeywordId === overKeywordId) {
            return;
        }

        const targetCategory = state.categories.find((category) => category.id === categoryId);
        if (!targetCategory) {
            return;
        }

        const oldIndex = targetCategory.keywords.findIndex((keyword) => keyword.id === activeKeywordId);
        const newIndex = targetCategory.keywords.findIndex((keyword) => keyword.id === overKeywordId);

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        setState((prev) => ({
            ...prev,
            saving: true,
            error: null,
            categories: prev.categories.map((category) => {
                if (category.id !== categoryId) {
                    return category;
                }

                return {
                    ...category,
                    keywords: arrayMove(category.keywords, oldIndex, newIndex),
                };
            }),
        }));

        try {
            await updateKeywordOrder({
                categoryId,
                keywordId: activeKeywordId,
                order: newIndex + 1,
            });
            await refresh();
        } catch (error) {
            setState((prev) => ({
                ...prev,
                saving: false,
                error: error instanceof Error ? error.message : 'Failed to reorder keyword',
            }));
            await refresh();
        } finally {
            setState((prev) => ({
                ...prev,
                saving: false,
            }));
        }
    }, [refresh, state.categories]);

    return useMemo(() => ({
        categories: state.categories,
        loading: state.loading,
        saving: state.saving,
        error: state.error,
        refresh,
        reorderCategory,
        reorderKeyword,
    }), [refresh, reorderCategory, reorderKeyword, state.categories, state.error, state.loading, state.saving]);
};
