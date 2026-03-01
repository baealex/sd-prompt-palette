import type { MouseEvent } from 'react';

import type { Keyword } from '~/models/types';

interface KeywordsListProps {
    keywords: Keyword[];
    onClick?: (keyword: Keyword) => void;
    onContextMenu?: (event: MouseEvent<HTMLButtonElement>, keyword: Keyword) => void;
}

export const KeywordsList = ({ keywords, onClick, onContextMenu }: KeywordsListProps) => {
    return (
        <ul className="mb-4 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
                <li key={keyword.id} className="list-none">
                    <button
                        type="button"
                        onClick={() => onClick?.(keyword)}
                        onContextMenu={(event) => onContextMenu?.(event, keyword)}
                        className="ui-focus-ring group relative inline-flex min-h-11 items-center rounded-token-md border border-line bg-surface-base px-3 py-2 text-xs text-ink-muted shadow-surface transition-colors hover:bg-surface-muted"
                    >
                        {keyword.name}
                        {keyword.image ? (
                            <img
                                loading="lazy"
                                src={keyword.image.url}
                                alt={keyword.name}
                                className="pointer-events-none absolute -bottom-1 left-full z-20 hidden w-28 rounded-token-md border border-line bg-surface-base shadow-raised group-hover:block group-focus-visible:block"
                            />
                        ) : null}
                    </button>
                </li>
            ))}
        </ul>
    );
};
