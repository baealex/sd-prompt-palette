import type { Collection } from '~/models/types';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';

import { CategoryHeader } from './CategoryHeader';
import { Image } from './Image';

interface CollectionCardProps {
    collection: Collection;
    onClickCopy: (text: string) => void;
    onClickRename?: () => void;
    onClickDelete: () => void;
    renaming?: boolean;
    removing?: boolean;
}

export const CollectionCard = ({
    collection,
    onClickCopy,
    onClickRename,
    onClickDelete,
    renaming = false,
    removing = false,
}: CollectionCardProps) => {
    return (
        <Card as="article" padding="none" className="mb-5 grid grid-cols-1 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
            <header className="col-span-full flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
                <h2 className="text-lg font-semibold text-ink">
                    {collection.title || '(untitled)'}
                </h2>
                <div className="flex items-center gap-2">
                    {onClickRename ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onClickRename}
                            disabled={renaming}
                        >
                            {renaming ? 'Renaming...' : 'Rename'}
                        </Button>
                    ) : null}
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onClickDelete}
                        disabled={removing}
                    >
                        {removing ? 'Removing...' : 'Remove'}
                    </Button>
                </div>
            </header>

            <div className="flex h-full items-center justify-center bg-surface-muted p-4 lg:w-[360px]">
                <Image
                    className="h-auto w-full object-contain"
                    alt={collection.title}
                    src={collection.image.url}
                    width={collection.image.width}
                    height={collection.image.height}
                />
            </div>

            <div className="p-4">
                <CategoryHeader title="Prompt" onClickCopy={() => onClickCopy(collection.prompt)} />
                <p className="mb-4 rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                    {collection.prompt || '-'}
                </p>

                <CategoryHeader title="Negative Prompt" onClickCopy={() => onClickCopy(collection.negativePrompt)} />
                <p className="rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                    {collection.negativePrompt || '-'}
                </p>
            </div>
        </Card>
    );
};
