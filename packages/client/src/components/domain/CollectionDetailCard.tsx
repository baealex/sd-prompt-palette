import type { Collection } from '~/models/types';
import { Button } from '~/components/ui/Button';

import { Image } from './Image';

interface CollectionDetailCardProps {
    collection: Collection;
    onClickCopy: (text: string) => void;
    onClickRename: () => void;
    onClickDelete: () => void;
    renaming?: boolean;
    removing?: boolean;
}

export const CollectionDetailCard = ({
    collection,
    onClickCopy,
    onClickRename,
    onClickDelete,
    renaming = false,
    removing = false,
}: CollectionDetailCardProps) => {
    return (
        <article className="space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-xl font-semibold text-ink">
                        {collection.title || '(untitled)'}
                    </h2>
                    <p className="mt-1 text-xs text-ink-subtle">
                        {collection.image.width} x {collection.image.height}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClickRename}
                        disabled={renaming}
                    >
                        {renaming ? 'Renaming...' : 'Rename'}
                    </Button>
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

            <section className="rounded-token-lg bg-surface-muted p-3 md:p-4">
                <Image
                    className="mx-auto block h-auto max-h-[80vh] w-full max-w-[1080px] object-contain"
                    alt={collection.title || 'Collection image'}
                    src={collection.image.url}
                    width={collection.image.width}
                    height={collection.image.height}
                />
            </section>

            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                <span className="rounded-full bg-surface-muted px-2.5 py-1">
                    {collection.image.width} x {collection.image.height}
                </span>
            </div>

            <details className="rounded-token-md border border-line bg-surface-base">
                <summary className="ui-focus-ring cursor-pointer px-3 py-2 text-sm font-semibold text-ink">
                    Prompt Metadata
                </summary>

                <div className="space-y-4 border-t border-line p-3">
                    <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink">Prompt</h3>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onClickCopy(collection.prompt)}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="rounded-token-md bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                            {collection.prompt || '-'}
                        </p>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink">Negative Prompt</h3>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onClickCopy(collection.negativePrompt)}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="rounded-token-md bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                            {collection.negativePrompt || '-'}
                        </p>
                    </div>
                </div>
            </details>
        </article>
    );
};
