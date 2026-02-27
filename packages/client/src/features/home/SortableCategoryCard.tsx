import { closestCenter, DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';

import { DragHandleIcon, MoreIcon } from '~/icons';
import { makeCategorySortableId, makeKeywordSortableId } from './dnd-ids';
import { SortableKeywordItem } from './SortableKeywordItem';
import type { HomeCategory } from './types';

interface SortableCategoryCardProps {
    category: HomeCategory;
    saving?: boolean;
    onKeywordDragEnd: (categoryId: number, event: DragEndEvent) => void;
    onCopyAllKeywords: (category: HomeCategory) => void;
    onRenameCategory: (category: HomeCategory) => void;
    onRemoveCategory: (categoryId: number) => void;
    onAddKeywords: (categoryId: number, rawKeywords: string) => void;
    onCopyKeyword: (keywordName: string) => void;
    onViewCollection: (keywordName: string) => void;
    onRemoveKeyword: (categoryId: number, keywordId: number) => void;
    onAddKeywordSampleImage: (keywordId: number) => void;
    onRemoveKeywordSampleImage: (keywordId: number) => void;
}

export const SortableCategoryCard = ({
    category,
    saving = false,
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
}: SortableCategoryCardProps) => {
    const [keywordInput, setKeywordInput] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const sortableId = makeCategorySortableId(category.id);
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId,
        disabled: saving,
    });

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

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        const closeMenuOnOutsideClick = (event: globalThis.MouseEvent) => {
            if (!menuRef.current) {
                return;
            }
            if (!menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const closeMenuOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', closeMenuOnOutsideClick);
        window.addEventListener('keydown', closeMenuOnEscape);

        return () => {
            window.removeEventListener('mousedown', closeMenuOnOutsideClick);
            window.removeEventListener('keydown', closeMenuOnEscape);
        };
    }, [menuOpen]);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const stopMenuEvent = (event: SyntheticEvent<HTMLElement>) => {
        event.stopPropagation();
    };

    const handleAddKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const input = keywordInput.trim();
        if (!input) {
            return;
        }
        onAddKeywords(category.id, input);
        setKeywordInput('');
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
            className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${isDragging ? 'z-10 opacity-80' : ''}`}
        >
            <header className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <button
                        ref={setActivatorNodeRef}
                        type="button"
                        aria-label={`Drag ${category.name}`}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 ${saving ? 'cursor-default opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
                        disabled={saving}
                        {...attributes}
                        {...listeners}
                    >
                        <DragHandleIcon width={12} height={12} />
                    </button>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">{category.name}</h3>
                        <p className="text-xs text-slate-500">Order #{category.order}</p>
                    </div>
                </div>

                <div
                    ref={menuRef}
                    className="relative shrink-0"
                    onPointerDown={stopMenuEvent}
                    onClick={stopMenuEvent}
                >
                    <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        disabled={saving}
                    >
                        <MoreIcon width={12} height={12} />
                    </button>
                    {menuOpen ? (
                        <div className="absolute right-0 top-8 z-30 min-w-[130px] rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                            <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                                onClick={() => {
                                    onCopyAllKeywords(category);
                                    closeMenu();
                                }}
                            >
                                Copy All
                            </button>
                            <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                                onClick={() => {
                                    onRenameCategory(category);
                                    closeMenu();
                                }}
                            >
                                Rename
                            </button>
                            <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-left text-xs text-red-700 hover:bg-red-50"
                                onClick={() => {
                                    onRemoveCategory(category.id);
                                    closeMenu();
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ) : null}
                </div>
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
                                disabled={saving}
                                onCopyKeyword={onCopyKeyword}
                                onViewCollection={onViewCollection}
                                onRemoveKeyword={(keywordId) => onRemoveKeyword(category.id, keywordId)}
                                onAddSampleImage={onAddKeywordSampleImage}
                                onRemoveSampleImage={onRemoveKeywordSampleImage}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            <form onSubmit={handleAddKeywordSubmit} className="mt-3 flex flex-wrap gap-2">
                <input
                    type="text"
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder="keyword1, keyword2"
                    className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-500"
                    disabled={saving}
                />
                <button
                    type="submit"
                    className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
                    disabled={saving}
                >
                    Add Keyword
                </button>
            </form>
        </article>
    );
};
