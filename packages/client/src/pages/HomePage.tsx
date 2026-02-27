import { closestCenter, DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { PageFrame } from '~/components/domain/PageFrame';
import { makeCategorySortableId, parseCategorySortableId, parseKeywordSortableId } from '~/features/home/dnd-ids';
import { SortableCategoryCard } from '~/features/home/SortableCategoryCard';
import { useHomeBoard } from '~/features/home/use-home-board';
import type { HomeCategory } from '~/features/home/types';
import { usePathStore } from '~/state/path-store';

export const HomePage = () => {
    const { paths } = usePathStore();
    const navigate = useNavigate();

    const [categoryName, setCategoryName] = useState('');
    const [pendingKeywordIdForImage, setPendingKeywordIdForImage] = useState<number | null>(null);
    const sampleImageInputRef = useRef<HTMLInputElement | null>(null);

    const {
        categories,
        loading,
        saving,
        error,
        reorderCategory,
        reorderKeyword,
        createCategoryByName,
        renameCategory,
        removeCategory,
        addKeywords,
        removeKeyword,
        addKeywordSampleImage,
        removeKeywordSampleImage,
    } = useHomeBoard();

    const categorySensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleCategoryDragEnd = useCallback((event: DragEndEvent) => {
        if (!event.over) {
            return;
        }

        const activeCategoryId = parseCategorySortableId(event.active.id);
        const overCategoryId = parseCategorySortableId(event.over.id);

        if (!activeCategoryId || !overCategoryId) {
            return;
        }

        void reorderCategory(activeCategoryId, overCategoryId);
    }, [reorderCategory]);

    const handleKeywordDragEnd = useCallback((categoryId: number, event: DragEndEvent) => {
        if (!event.over) {
            return;
        }

        const activeKeyword = parseKeywordSortableId(event.active.id);
        const overKeyword = parseKeywordSortableId(event.over.id);

        if (!activeKeyword || !overKeyword) {
            return;
        }

        if (activeKeyword.categoryId !== categoryId || overKeyword.categoryId !== categoryId) {
            return;
        }

        void reorderKeyword(categoryId, activeKeyword.keywordId, overKeyword.keywordId);
    }, [reorderKeyword]);

    const copyText = useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text);
    }, []);

    const handleCreateCategory = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            return;
        }

        void createCategoryByName(trimmedName);
        setCategoryName('');
    }, [categoryName, createCategoryByName]);

    const handleCopyAllKeywords = useCallback((category: HomeCategory) => {
        const keywordText = category.keywords.map((keyword) => keyword.name).join(', ');
        if (!keywordText) {
            return;
        }
        void copyText(keywordText);
    }, [copyText]);

    const handleRenameCategory = useCallback((category: HomeCategory) => {
        const nextName = window.prompt('Enter new category name', category.name);
        if (!nextName || !nextName.trim()) {
            return;
        }
        void renameCategory(category.id, nextName.trim());
    }, [renameCategory]);

    const handleRemoveCategory = useCallback((categoryId: number) => {
        const confirmed = window.confirm('Delete this category?');
        if (!confirmed) {
            return;
        }
        void removeCategory(categoryId);
    }, [removeCategory]);

    const handleAddKeywords = useCallback((categoryId: number, rawKeywords: string) => {
        void addKeywords(categoryId, rawKeywords);
    }, [addKeywords]);

    const handleCopyKeyword = useCallback((keywordName: string) => {
        void copyText(keywordName);
    }, [copyText]);

    const handleViewCollection = useCallback((keywordName: string) => {
        void navigate({
            to: paths.collection,
            search: { query: keywordName },
        });
    }, [navigate, paths.collection]);

    const handleRemoveKeyword = useCallback((categoryId: number, keywordId: number) => {
        const confirmed = window.confirm('Remove this keyword?');
        if (!confirmed) {
            return;
        }
        void removeKeyword(categoryId, keywordId);
    }, [removeKeyword]);

    const handleAddKeywordSampleImageRequest = useCallback((keywordId: number) => {
        setPendingKeywordIdForImage(keywordId);
        sampleImageInputRef.current?.click();
    }, []);

    const handleSampleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const imageFile = event.target.files?.[0];
        if (!imageFile || !pendingKeywordIdForImage) {
            setPendingKeywordIdForImage(null);
            return;
        }

        void addKeywordSampleImage(pendingKeywordIdForImage, imageFile);
        setPendingKeywordIdForImage(null);
        event.target.value = '';
    }, [addKeywordSampleImage, pendingKeywordIdForImage]);

    const handleRemoveKeywordSampleImage = useCallback((keywordId: number) => {
        void removeKeywordSampleImage(keywordId);
    }, [removeKeywordSampleImage]);

    return (
        <PageFrame
            title="Home"
            description="Manage categories/keywords with visible actions and dnd-kit ordering."
        >
            <form onSubmit={handleCreateCategory} className="mb-4 flex flex-wrap gap-2">
                <input
                    type="text"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="Enter a category"
                    className="min-w-[220px] flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
                    disabled={saving}
                />
                <button
                    type="submit"
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
                    disabled={saving}
                >
                    Add Category
                </button>
            </form>

            {loading ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Loading categories...</p>
            ) : null}

            <DndContext
                sensors={categorySensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
            >
                <SortableContext
                    items={categories.map((category) => makeCategorySortableId(category.id))}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <SortableCategoryCard
                                key={category.id}
                                category={category}
                                saving={saving}
                                onKeywordDragEnd={handleKeywordDragEnd}
                                onCopyAllKeywords={handleCopyAllKeywords}
                                onRenameCategory={handleRenameCategory}
                                onRemoveCategory={handleRemoveCategory}
                                onAddKeywords={handleAddKeywords}
                                onCopyKeyword={handleCopyKeyword}
                                onViewCollection={handleViewCollection}
                                onRemoveKeyword={handleRemoveKeyword}
                                onAddKeywordSampleImage={handleAddKeywordSampleImageRequest}
                                onRemoveKeywordSampleImage={handleRemoveKeywordSampleImage}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {saving ? (
                <p className="mt-4 rounded-md border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
                    Updating order...
                </p>
            ) : null}

            {error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}

            <input
                ref={sampleImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSampleImageChange}
            />
        </PageFrame>
    );
};
