import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';

import { DragHandleIcon, MoreIcon } from '~/icons';
import type { Keyword } from '~/models/types';

import { makeKeywordSortableId } from './dnd-ids';

interface SortableKeywordItemProps {
    categoryId: number;
    keyword: Keyword;
    disabled?: boolean;
    onCopyKeyword: (keywordName: string) => void;
    onViewCollection: (keywordName: string) => void;
    onRemoveKeyword: (keywordId: number) => void;
    onAddSampleImage: (keywordId: number) => void;
    onRemoveSampleImage: (keywordId: number) => void;
}

export const SortableKeywordItem = ({
    categoryId,
    keyword,
    disabled = false,
    onCopyKeyword,
    onViewCollection,
    onRemoveKeyword,
    onAddSampleImage,
    onRemoveSampleImage,
}: SortableKeywordItemProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const sortableId = makeKeywordSortableId(categoryId, keyword.id);
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
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
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

    const stopDragFromMenu = (event: SyntheticEvent<HTMLElement>) => {
        event.stopPropagation();
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`group relative list-none rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-sm select-none ${isDragging ? 'z-10 opacity-70' : ''}`}
        >
            <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <button
                        ref={setActivatorNodeRef}
                        type="button"
                        aria-label={`Drag ${keyword.name}`}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 ${disabled ? 'cursor-default opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
                        disabled={disabled}
                        {...attributes}
                        {...listeners}
                    >
                        <DragHandleIcon width={12} height={12} />
                    </button>
                    <p className="truncate text-left text-sm font-medium text-slate-800">
                        {keyword.name}
                    </p>
                </div>

                <div
                    ref={menuRef}
                    className="relative shrink-0"
                    onPointerDown={stopDragFromMenu}
                    onClick={stopDragFromMenu}
                >
                    <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        disabled={disabled}
                    >
                        <MoreIcon width={12} height={12} />
                    </button>
                    {menuOpen ? (
                        <div className="absolute right-0 top-8 z-30 min-w-[130px] rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                            <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                                onClick={() => {
                                    onCopyKeyword(keyword.name);
                                    closeMenu();
                                }}
                            >
                                Copy
                            </button>
                            <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                                onClick={() => {
                                    onViewCollection(keyword.name);
                                    closeMenu();
                                }}
                            >
                                View Collection
                            </button>
                            {keyword.image ? (
                                <button
                                    type="button"
                                    className="w-full rounded px-2 py-1.5 text-left text-xs text-amber-700 hover:bg-amber-50"
                                    onClick={() => {
                                        onRemoveSampleImage(keyword.id);
                                        closeMenu();
                                    }}
                                >
                                    Remove Sample
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="w-full rounded px-2 py-1.5 text-left text-xs text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => {
                                        onAddSampleImage(keyword.id);
                                        closeMenu();
                                    }}
                                >
                                    Add Sample
                                </button>
                            )}
                            <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-left text-xs text-red-700 hover:bg-red-50"
                                onClick={() => {
                                    onRemoveKeyword(keyword.id);
                                    closeMenu();
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
            {keyword.image ? (
                <img
                    loading="lazy"
                    src={keyword.image.url}
                    alt={keyword.name}
                    className="pointer-events-none absolute -bottom-2 left-full z-20 hidden w-28 rounded-lg border border-slate-200 bg-white shadow-md group-hover:block"
                />
            ) : null}
        </li>
    );
};
