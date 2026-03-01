import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef } from 'react';
import type { SyntheticEvent } from 'react';

import { Card } from '~/components/ui/Card';
import { cn } from '~/components/ui/cn';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
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

    const stopDragFromMenu = (event: SyntheticEvent<HTMLElement>) => {
        event.stopPropagation();
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
                    className="relative shrink-0"
                    onPointerDown={stopDragFromMenu}
                    onClick={stopDragFromMenu}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="ui-focus-ring inline-flex h-11 w-11 items-center justify-center rounded-token-sm text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink-muted"
                                disabled={disabled}
                                aria-label={`${keyword.name} actions`}
                            >
                                <MoreIcon width={14} height={14} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={8}>
                            <DropdownMenuItem
                                onSelect={() => {
                                    onCopyKeyword(keyword.name);
                                }}
                            >
                                Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => {
                                    onViewCollection(keyword.name);
                                }}
                            >
                                View Collection
                            </DropdownMenuItem>
                            {keyword.image ? (
                                <DropdownMenuItem
                                    className="text-warning-700 data-[highlighted]:bg-warning-50 data-[highlighted]:text-warning-700"
                                    onSelect={() => {
                                        onRemoveSampleImage(keyword.id);
                                    }}
                                >
                                    Remove Sample
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    className="text-success-700 data-[highlighted]:bg-success-50 data-[highlighted]:text-success-700"
                                    onSelect={() => {
                                        onAddSampleImage(keyword.id);
                                    }}
                                >
                                    Add Sample
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="text-danger-700 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700"
                                onSelect={() => {
                                    onRemoveKeyword(keyword.id);
                                }}
                            >
                                Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
