import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    createCategory,
    createKeyword,
    createSampleImage,
    deleteCategory,
    deleteKeyword,
    deleteSampleImage,
    getCategories,
    imageUpload,
    updateCategory,
    updateCategoryOrder,
    updateKeywordOrder,
} from '~/api';
import { imageToBase64 } from '~/modules/image';

import type { HomeCategory } from './types';

const sortCategories = (categories: HomeCategory[]) => [...categories].sort((left, right) => left.order - right.order);
const normalizeCategories = (categories: HomeCategory[]): HomeCategory[] => categories.map((category) => ({
    ...category,
    id: Number(category.id),
    order: Number(category.order),
    keywords: category.keywords.map((keyword) => ({
        ...keyword,
        id: Number(keyword.id),
        categories: keyword.categories?.map((link) => ({
            ...link,
            id: Number(link.id),
            order: Number(link.order),
        })),
    })),
}));

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

    const setSaving = useCallback((nextSaving: boolean) => {
        setState((prev) => ({
            ...prev,
            saving: nextSaving,
        }));
    }, []);

    const setError = useCallback((message: string | null) => {
        setState((prev) => ({
            ...prev,
            error: message,
        }));
    }, []);

    const refresh = useCallback(async (showLoading = false) => {
        setState((prev) => ({
            ...prev,
            loading: showLoading ? true : prev.loading,
            error: null,
        }));

        try {
            const response = await getCategories();
            setState((prev) => ({
                ...prev,
                loading: false,
                error: null,
                categories: sortCategories(normalizeCategories(response.data.allCategories)),
            }));
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to load categories',
            }));
        }
    }, []);

    const runMutation = useCallback(async (action: () => Promise<void>, fallbackMessage: string) => {
        setSaving(true);
        setError(null);
        try {
            await action();
            await refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : fallbackMessage);
        } finally {
            setSaving(false);
        }
    }, [refresh, setError, setSaving]);

    useEffect(() => {
        void refresh(true);
    }, [refresh]);

    const reorderCategory = useCallback(async (activeCategoryId: number, overCategoryId: number) => {
        if (activeCategoryId === overCategoryId) {
            return;
        }

        const current = state.categories;
        const previous = current;
        const oldIndex = current.findIndex((category) => Number(category.id) === activeCategoryId);
        const newIndex = current.findIndex((category) => Number(category.id) === overCategoryId);

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
            error: null,
        }));

        try {
            await updateCategoryOrder({
                id: activeCategoryId,
                order: newIndex + 1,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                categories: previous,
                error: error instanceof Error ? error.message : 'Failed to reorder category',
            }));
            await refresh();
        }
    }, [refresh, state.categories]);

    const reorderKeyword = useCallback(async (categoryId: number, activeKeywordId: number, overKeywordId: number) => {
        if (activeKeywordId === overKeywordId) {
            return;
        }

        const previous = state.categories;
        const targetCategory = state.categories.find((category) => Number(category.id) === categoryId);
        if (!targetCategory) {
            return;
        }

        const oldIndex = targetCategory.keywords.findIndex((keyword) => Number(keyword.id) === activeKeywordId);
        const newIndex = targetCategory.keywords.findIndex((keyword) => Number(keyword.id) === overKeywordId);

        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        setState((prev) => ({
            ...prev,
            error: null,
            categories: prev.categories.map((category) => {
                if (Number(category.id) !== categoryId) {
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
        } catch (error) {
            setState((prev) => ({
                ...prev,
                categories: previous,
                error: error instanceof Error ? error.message : 'Failed to reorder keyword',
            }));
            await refresh();
        }
    }, [refresh, state.categories]);

    const createCategoryByName = useCallback(async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Category name is required');
            return;
        }

        await runMutation(async () => {
            await createCategory({ name: trimmedName });
        }, 'Failed to create category');
    }, [runMutation, setError]);

    const renameCategory = useCallback(async (categoryId: number, name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Category name is required');
            return;
        }

        await runMutation(async () => {
            await updateCategory({ id: categoryId, name: trimmedName });
        }, 'Failed to rename category');
    }, [runMutation, setError]);

    const removeCategory = useCallback(async (categoryId: number) => {
        await runMutation(async () => {
            await deleteCategory({ id: categoryId });
        }, 'Failed to delete category');
    }, [runMutation]);

    const addKeywords = useCallback(async (categoryId: number, rawKeywords: string) => {
        const names = rawKeywords
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name.length > 0);

        if (names.length === 0) {
            setError('Keyword is required');
            return;
        }

        await runMutation(async () => {
            for (const name of names) {
                await createKeyword({
                    categoryId,
                    name,
                });
            }
        }, 'Failed to add keywords');
    }, [runMutation, setError]);

    const removeKeyword = useCallback(async (categoryId: number, keywordId: number) => {
        await runMutation(async () => {
            await deleteKeyword({
                categoryId,
                keywordId,
            });
        }, 'Failed to remove keyword');
    }, [runMutation]);

    const addKeywordSampleImage = useCallback(async (keywordId: number, imageFile: File) => {
        await runMutation(async () => {
            const imageBase64 = await imageToBase64(imageFile);
            const uploadedImage = await imageUpload({ image: imageBase64 });
            await createSampleImage({
                keywordId,
                imageId: uploadedImage.data.id,
            });
        }, 'Failed to add sample image');
    }, [runMutation]);

    const removeKeywordSampleImage = useCallback(async (keywordId: number) => {
        await runMutation(async () => {
            await deleteSampleImage({ id: keywordId });
        }, 'Failed to remove sample image');
    }, [runMutation]);

    return useMemo(() => ({
        categories: state.categories,
        loading: state.loading,
        saving: state.saving,
        error: state.error,
        refresh,
        reorderCategory,
        reorderKeyword,
        createCategoryByName,
        renameCategory,
        removeCategory,
        addKeywords,
        removeKeyword,
        addKeywordSampleImage,
        removeKeywordSampleImage,
    }), [
        addKeywordSampleImage,
        addKeywords,
        createCategoryByName,
        refresh,
        removeCategory,
        removeKeyword,
        removeKeywordSampleImage,
        renameCategory,
        reorderCategory,
        reorderKeyword,
        state.categories,
        state.error,
        state.loading,
        state.saving,
    ]);
};
