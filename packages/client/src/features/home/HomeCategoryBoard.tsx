import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {
    makeCategorySortableId,
    parseCategorySortableId,
} from '~/features/home/dnd-ids';
import { SortableCategoryCard } from '~/features/home/SortableCategoryCard';
import type { HomeCategory } from '~/features/home/types';

interface HomeCategoryBoardProps {
    categories: HomeCategory[];
    saving: boolean;
    onReorderCategory: (activeCategoryId: number, overCategoryId: number) => void;
    onKeywordDragEnd: (categoryId: number, event: DragEndEvent) => void;
    onCopyAllKeywords: (category: HomeCategory) => void;
    onRenameCategory: (category: HomeCategory) => void;
    onRemoveCategory: (categoryId: number) => void;
    onAddKeywords: (categoryId: number, rawKeywords: string) => Promise<boolean>;
    onCopyKeyword: (keywordName: string) => void;
    onViewCollection: (keywordName: string) => void;
    onRemoveKeyword: (categoryId: number, keywordId: number) => void;
    onAddKeywordSampleImage: (keywordId: number) => void;
    onRemoveKeywordSampleImage: (keywordId: number) => void;
}

export const HomeCategoryBoard = ({
    categories,
    saving,
    onReorderCategory,
    onKeywordDragEnd,
    onCopyAllKeywords,
    onRenameCategory,
    onRemoveCategory,
    onAddKeywords,
    onCopyKeyword,
    onViewCollection,
    onRemoveKeyword,
    onAddKeywordSampleImage,
    onRemoveKeywordSampleImage,
}: HomeCategoryBoardProps) => {
    const categorySensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleCategoryDragEnd = (event: DragEndEvent) => {
        if (!event.over) {
            return;
        }

        const activeCategoryId = parseCategorySortableId(event.active.id);
        const overCategoryId = parseCategorySortableId(event.over.id);

        if (!activeCategoryId || !overCategoryId) {
            return;
        }

        onReorderCategory(activeCategoryId, overCategoryId);
    };

    return (
        <DndContext
            sensors={categorySensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
        >
            <SortableContext
                items={categories.map((category) =>
                    makeCategorySortableId(category.id),
                )}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">
                    {categories.map((category) => (
                        <SortableCategoryCard
                            key={category.id}
                            category={category}
                            saving={saving}
                            onKeywordDragEnd={onKeywordDragEnd}
                            onCopyAllKeywords={onCopyAllKeywords}
                            onRenameCategory={onRenameCategory}
                            onRemoveCategory={onRemoveCategory}
                            onAddKeywords={onAddKeywords}
                            onCopyKeyword={onCopyKeyword}
                            onViewCollection={onViewCollection}
                            onRemoveKeyword={onRemoveKeyword}
                            onAddKeywordSampleImage={onAddKeywordSampleImage}
                            onRemoveKeywordSampleImage={onRemoveKeywordSampleImage}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};
