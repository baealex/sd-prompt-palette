import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef } from 'react';

import { Card } from '~/components/ui/Card';
import { cn } from '~/components/ui/cn';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '~/components/ui/HoverCard';
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
        setActivatorNodeRef,
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
    };

    useEffect(() => {
        if (isDragging) {
            wasDraggingRef.current = true;
        }
    }, [isDragging]);

    const handleCopyClick = () => {
        if (wasDraggingRef.current) {
            wasDraggingRef.current = false;
            return;
        }
        onCopyKeyword(keyword.name);
    };
    const keywordButton = (
        <button
            ref={setActivatorNodeRef}
            type="button"
            className={cn(
                'ui-focus-ring min-w-0 truncate rounded-sm text-left text-sm font-medium text-ink',
                disabled
                    ? 'cursor-default'
                    : 'cursor-grab active:cursor-grabbing',
            )}
            style={{ touchAction: 'none' }}
            onClick={handleCopyClick}
            {...attributes}
            {...listeners}
        >
            {keyword.name}
        </button>
    );

    return (
        <Card
            as="li"
            padding="none"
            ref={setNodeRef}
            style={style}
            emphasis="flat"
            className={cn(
                'group relative list-none rounded-token-md py-1 pl-2.5 pr-0.5 text-sm select-none',
                isDragging ? 'z-10 opacity-70' : '',
            )}
        >
            <div className="flex min-w-0 items-center gap-0.5">
                {keyword.image ? (
                    <HoverCard openDelay={120} closeDelay={100}>
                        <HoverCardTrigger asChild>
                            {keywordButton}
                        </HoverCardTrigger>
                        <HoverCardContent
                            side="right"
                            align="start"
                            className="w-28 p-0"
                        >
                            <img
                                loading="lazy"
                                src={keyword.image.url}
                                alt={keyword.name}
                                className="block h-auto w-full"
                            />
                        </HoverCardContent>
                    </HoverCard>
                ) : (
                    keywordButton
                )}

                <div className="relative shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="ui-focus-ring inline-flex h-8 w-8 items-center justify-center rounded-token-sm text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink-muted"
                                disabled={disabled}
                                aria-label={`${keyword.name} actions`}
                            >
                                <MoreIcon width={12} height={12} />
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
        </Card>
    );
};
