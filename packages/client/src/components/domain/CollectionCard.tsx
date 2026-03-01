import { useEffect, useRef, useState } from 'react';

import { ArrowRightIcon, MoreIcon } from '~/icons';
import type { Collection } from '~/models/types';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { IconButton } from '~/components/ui/IconButton';

import { CategoryHeader } from './CategoryHeader';
import { Image } from '~/components/ui/Image';

interface CollectionCardProps {
    collection: Collection;
    onClickCopy: (text: string, label?: string) => void;
    onClickOpenDetail?: () => void;
    onClickRename?: () => void;
    onClickDelete: () => void;
    renaming?: boolean;
    removing?: boolean;
}

export const CollectionCard = ({
    collection,
    onClickCopy,
    onClickOpenDetail,
    onClickRename,
    onClickDelete,
    renaming = false,
    removing = false,
}: CollectionCardProps) => {
    const displayTitle = collection.title || '(untitled)';
    const promptPreview = collection.prompt || '-';
    const negativePromptPreview = collection.negativePrompt || '-';
    const [actionMenuOpen, setActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!actionMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            if (
                actionMenuRef.current &&
                !actionMenuRef.current.contains(target)
            ) {
                setActionMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        return () => {
            window.removeEventListener('mousedown', handlePointerDown);
        };
    }, [actionMenuOpen]);

    useEffect(() => {
        if (renaming || removing) {
            setActionMenuOpen(false);
        }
    }, [renaming, removing]);

    return (
        <Card as="article" padding="none" className="mb-4 overflow-hidden">
            <header className="col-span-full flex flex-wrap items-center justify-between gap-2 border-b border-line p-3 sm:p-4">
                {onClickOpenDetail ? (
                    <button
                        type="button"
                        className="ui-focus-ring rounded-token-sm text-left text-lg font-semibold text-ink transition-colors hover:text-brand-700"
                        onClick={onClickOpenDetail}
                    >
                        {displayTitle}
                    </button>
                ) : (
                    <h2 className="text-lg font-semibold text-ink">
                        {displayTitle}
                    </h2>
                )}
                <div className="flex items-center gap-2">
                    {onClickOpenDetail ? (
                        <IconButton
                            icon={
                                <ArrowRightIcon
                                    width={14}
                                    height={14}
                                />
                            }
                            label="Open detail"
                            variant="ghost"
                            size="sm"
                            onClick={onClickOpenDetail}
                        />
                    ) : null}
                    <div
                        ref={actionMenuRef}
                        className="relative"
                    >
                        <IconButton
                            icon={
                                <MoreIcon
                                    width={16}
                                    height={16}
                                />
                            }
                            label="Collection actions"
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                setActionMenuOpen((prev) => !prev);
                            }}
                            disabled={renaming || removing}
                        />
                        {actionMenuOpen ? (
                            <div className="absolute right-0 top-12 z-20 w-36 rounded-token-md border border-line bg-surface-base p-1 shadow-raised">
                                {onClickRename ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full !justify-start !text-left"
                                        onClick={() => {
                                            setActionMenuOpen(false);
                                            onClickRename();
                                        }}
                                        disabled={renaming || removing}
                                    >
                                        {renaming ? 'Renaming...' : 'Rename'}
                                    </Button>
                                ) : null}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full !justify-start !text-left text-danger-700 hover:bg-danger-50"
                                    onClick={() => {
                                        setActionMenuOpen(false);
                                        onClickDelete();
                                    }}
                                    disabled={removing || renaming}
                                >
                                    {removing ? 'Removing...' : 'Delete'}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                    <CategoryHeader
                        title="Prompt"
                        onClickCopy={() => onClickCopy(collection.prompt, 'Prompt')}
                    />
                    <p className="mb-4 rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
                        {promptPreview}
                    </p>

                    <CategoryHeader
                        title="Negative Prompt"
                        onClickCopy={() =>
                            onClickCopy(
                                collection.negativePrompt,
                                'Negative prompt',
                            )}
                    />
                    <p className="rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                        {negativePromptPreview}
                    </p>
                </div>

                <div className="flex items-start">
                    {onClickOpenDetail ? (
                        <button
                            type="button"
                            className="ui-focus-ring w-full overflow-hidden rounded-token-md border border-line bg-surface-muted transition-colors hover:border-brand-300"
                            onClick={onClickOpenDetail}
                        >
                            <Image
                                className="block h-auto w-full"
                                alt={displayTitle}
                                src={collection.image.url}
                                width={collection.image.width}
                                height={collection.image.height}
                            />
                        </button>
                    ) : (
                        <div className="w-full overflow-hidden rounded-token-md border border-line bg-surface-muted">
                            <Image
                                className="block h-auto w-full"
                                alt={displayTitle}
                                src={collection.image.url}
                                width={collection.image.width}
                                height={collection.image.height}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
