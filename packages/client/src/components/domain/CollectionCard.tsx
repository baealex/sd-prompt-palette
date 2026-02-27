import type { Collection } from '~/models/types';

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
        <article className="mb-5 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-300 bg-white lg:grid-cols-[360px_minmax(0,1fr)]">
            <header className="col-span-full flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    {collection.title || '(untitled)'}
                </h2>
                <div className="flex items-center gap-2">
                    {onClickRename ? (
                        <button
                            type="button"
                            onClick={onClickRename}
                            disabled={renaming}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {renaming ? 'Renaming...' : 'Rename'}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onClickDelete}
                        disabled={removing}
                        className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                    >
                        {removing ? 'Removing...' : 'Remove'}
                    </button>
                </div>
            </header>

            <Image
                className="h-auto w-full bg-slate-50 p-4 object-contain lg:w-[360px]"
                alt={collection.title}
                src={collection.image.url}
                width={collection.image.width}
                height={collection.image.height}
            />

            <div className="p-4">
                <CategoryHeader title="Prompt" onClickCopy={() => onClickCopy(collection.prompt)} />
                <p className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {collection.prompt || '-'}
                </p>

                <CategoryHeader title="Negative Prompt" onClickCopy={() => onClickCopy(collection.negativePrompt)} />
                <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {collection.negativePrompt || '-'}
                </p>
            </div>
        </article>
    );
};
