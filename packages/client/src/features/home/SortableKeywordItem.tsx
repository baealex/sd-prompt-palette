import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';

import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { cn } from '~/components/ui/cn';
import { MoreIcon } from '~/icons';
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
    const wasDraggingRef = useRef(false);

    const sortableId = makeKeywordSortableId(categoryId, keyword.id);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId,
        disabled,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: 'none',
    };

    useEffect(() => {
        if (isDragging) {
            wasDraggingRef.current = true;
        }
    }, [isDragging]);

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

    const handleCopyClick = () => {
        if (wasDraggingRef.current) {
            wasDraggingRef.current = false;
            return;
        }
        onCopyKeyword(keyword.name);
    };

    return (
        <Card
            as="li"
            padding="none"
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative min-h-11 list-none py-2 pl-3 pr-1 text-sm select-none',
                isDragging ? 'z-10 opacity-70' : '',
                disabled
                    ? 'cursor-default'
                    : 'cursor-grab active:cursor-grabbing',
            )}
            {...attributes}
            {...listeners}
        >
            <div className="flex min-w-0 items-center gap-0.5">
                <button
                    type="button"
                    className="ui-focus-ring min-w-0 truncate rounded-sm text-left text-sm font-medium text-ink"
                    onClick={handleCopyClick}
                >
                    {keyword.name}
                </button>

                <div
                    ref={menuRef}
                    className="relative shrink-0"
                    onPointerDown={stopDragFromMenu}
                    onClick={stopDragFromMenu}
                >
                    <button
                        type="button"
                        className="ui-focus-ring inline-flex h-11 w-11 items-center justify-center rounded-token-sm text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink-muted"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        disabled={disabled}
                        aria-label={`${keyword.name} actions`}
                    >
                        <MoreIcon width={14} height={14} />
                    </button>
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
        </Card>
    );
};
