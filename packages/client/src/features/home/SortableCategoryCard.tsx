import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    type DragEndEvent,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, SyntheticEvent } from 'react';

import { Button } from '~/components/ui/Button';
import { IconButton } from '~/components/ui/IconButton';
import { Input } from '~/components/ui/Input';
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
    onAddKeywords: (
        categoryId: number,
        rawKeywords: string,
    ) => Promise<boolean>;
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
        transform: CSS.Translate.toString(transform),
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

    const handleAddKeywordSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        const input = keywordInput.trim();
        if (!input) {
            return;
        }
        const created = await onAddKeywords(category.id, input);
        if (created) {
            setKeywordInput('');
        }
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
            className={`rounded-token-lg border border-line bg-surface-base p-4 shadow-surface ${isDragging ? 'z-10 opacity-80' : ''}`}
        >
            <header className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <IconButton
                        ref={setActivatorNodeRef}
                        label={`Drag ${category.name}`}
                        icon={<DragHandleIcon width={14} height={14} />}
                        className={
                            saving
                                ? 'cursor-default'
                                : 'cursor-grab active:cursor-grabbing'
                        }
                        disabled={saving}
                        {...attributes}
                        {...listeners}
                    />
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-ink">
                            {category.name}
                        </h3>
                        <p className="text-xs text-ink-subtle">
                            Order #{category.order}
                        </p>
                    </div>
                </div>

                <div
                    ref={menuRef}
                    className="relative shrink-0"
                    onPointerDown={stopMenuEvent}
                    onClick={stopMenuEvent}
                >
                    <IconButton
                        label={`${category.name} actions`}
                        icon={<MoreIcon width={14} height={14} />}
                        onClick={() => setMenuOpen((prev) => !prev)}
                        disabled={saving}
                    />
                    {menuOpen ? (
                        <div className="absolute right-0 top-12 z-30 min-w-[152px] rounded-token-md border border-line bg-surface-base p-1 shadow-raised">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                    onCopyAllKeywords(category);
                                    closeMenu();
                                }}
                            >
                                Copy All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                    onRenameCategory(category);
                                    closeMenu();
                                }}
                            >
                                Rename
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-danger-700 hover:bg-danger-50"
                                onClick={() => {
                                    onRemoveCategory(category.id);
                                    closeMenu();
                                }}
                            >
                                Remove
                            </Button>
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
                    items={category.keywords.map((keyword) =>
                        makeKeywordSortableId(category.id, keyword.id),
                    )}
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
                                onRemoveKeyword={(keywordId) =>
                                    onRemoveKeyword(category.id, keywordId)
                                }
                                onAddSampleImage={onAddKeywordSampleImage}
                                onRemoveSampleImage={onRemoveKeywordSampleImage}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            <form
                onSubmit={handleAddKeywordSubmit}
                className="mt-3 flex flex-wrap gap-2"
            >
                <Input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder="keyword1, keyword2"
                    className="min-w-[220px] flex-1 text-xs"
                    disabled={saving}
                />
                <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={saving}
                >
                    Add Keyword
                </Button>
            </form>
        </article>
    );
};
