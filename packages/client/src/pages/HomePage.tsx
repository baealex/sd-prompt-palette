import { closestCenter, DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCallback } from 'react';

import { PageFrame } from '~/components/domain/PageFrame';
import { makeCategorySortableId, parseCategorySortableId, parseKeywordSortableId } from '~/features/home/dnd-ids';
import { SortableCategoryCard } from '~/features/home/SortableCategoryCard';
import { useHomeBoard } from '~/features/home/use-home-board';

export const HomePage = () => {
    const {
        categories,
        loading,
        saving,
        error,
        reorderCategory,
        reorderKeyword,
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

    return (
        <PageFrame
            title="Home"
            description="dnd-kit reorder migration: drag categories and keywords to update order."
        >
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
                                onKeywordDragEnd={handleKeywordDragEnd}
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
        </PageFrame>
    );
};
