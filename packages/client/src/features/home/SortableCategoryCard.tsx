import { closestCenter, DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { makeCategorySortableId, makeKeywordSortableId } from './dnd-ids';
import { SortableKeywordItem } from './SortableKeywordItem';
import type { HomeCategory } from './types';

interface SortableCategoryCardProps {
    category: HomeCategory;
    onKeywordDragEnd: (categoryId: number, event: DragEndEvent) => void;
}

export const SortableCategoryCard = ({ category, onKeywordDragEnd }: SortableCategoryCardProps) => {
    const sortableId = makeCategorySortableId(category.id);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sortableId });

    const keywordSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
            className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${isDragging ? 'z-10 opacity-80' : ''}`}
        >
            <header className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-xs text-slate-500">Order #{category.order}</p>
                </div>
                <button
                    type="button"
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    {...attributes}
                    {...listeners}
                >
                    Drag Category
                </button>
            </header>

            <DndContext
                sensors={keywordSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => onKeywordDragEnd(category.id, event)}
            >
                <SortableContext
                    items={category.keywords.map((keyword) => makeKeywordSortableId(category.id, keyword.id))}
                    strategy={rectSortingStrategy}
                >
                    <ul className="flex flex-wrap gap-2">
                        {category.keywords.map((keyword) => (
                            <SortableKeywordItem
                                key={keyword.id}
                                categoryId={category.id}
                                keyword={keyword}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
        </article>
    );
};
