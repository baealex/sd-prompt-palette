import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';

import { Button } from '~/components/ui/Button';
import { IconButton } from '~/components/ui/IconButton';
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
            className={`group relative list-none rounded-token-md border border-line bg-surface-base p-2 text-sm text-ink-muted shadow-surface select-none ${isDragging ? 'z-10 opacity-70' : ''}`}
        >
            <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <IconButton
                        ref={setActivatorNodeRef}
                        label={`Drag ${keyword.name}`}
                        icon={<DragHandleIcon width={14} height={14} />}
                        size="sm"
                        className={disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                        disabled={disabled}
                        {...attributes}
                        {...listeners}
                    />
                    <p className="truncate text-left text-sm font-medium text-ink">
                        {keyword.name}
                    </p>
                </div>

                <div
                    ref={menuRef}
                    className="relative shrink-0"
                    onPointerDown={stopDragFromMenu}
                    onClick={stopDragFromMenu}
                >
                    <IconButton
                        label={`${keyword.name} actions`}
                        icon={<MoreIcon width={14} height={14} />}
                        size="sm"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        disabled={disabled}
                    />
                    {menuOpen ? (
                        <div className="absolute right-0 top-12 z-30 min-w-[152px] rounded-token-md border border-line bg-surface-base p-1 shadow-raised">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                    onCopyKeyword(keyword.name);
                                    closeMenu();
                                }}
                            >
                                Copy
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                    onViewCollection(keyword.name);
                                    closeMenu();
                                }}
                            >
                                View Collection
                            </Button>
                            {keyword.image ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-warning-700 hover:bg-warning-50"
                                    onClick={() => {
                                        onRemoveSampleImage(keyword.id);
                                        closeMenu();
                                    }}
                                >
                                    Remove Sample
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-success-700 hover:bg-success-50"
                                    onClick={() => {
                                        onAddSampleImage(keyword.id);
                                        closeMenu();
                                    }}
                                >
                                    Add Sample
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-danger-700 hover:bg-danger-50"
                                onClick={() => {
                                    onRemoveKeyword(keyword.id);
                                    closeMenu();
                                }}
                            >
                                Remove
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
            {keyword.image ? (
                <img
                    loading="lazy"
                    src={keyword.image.url}
                    alt={keyword.name}
                    className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-28 rounded-token-md border border-line bg-surface-base shadow-raised group-focus-within:block md:-bottom-2 md:left-full md:top-auto md:mt-0 md:group-hover:block md:group-focus-within:block"
                />
            ) : null}
        </li>
    );
};
