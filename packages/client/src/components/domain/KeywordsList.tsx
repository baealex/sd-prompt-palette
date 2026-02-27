import type { KeyboardEvent, MouseEvent } from 'react';

import type { Keyword } from '~/models/types';

interface KeywordsListProps {
    keywords: Keyword[];
    onClick?: (keyword: Keyword) => void;
    onContextMenu?: (event: MouseEvent<HTMLLIElement>, keyword: Keyword) => void;
}

const handleEnterKey = (event: KeyboardEvent<HTMLLIElement>, onClick: (() => void) | undefined) => {
    if (event.key === 'Enter') {
        onClick?.();
    }
};

export const KeywordsList = ({ keywords, onClick, onContextMenu }: KeywordsListProps) => {
    return (
        <ul className="mb-4 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
                <li
                    key={keyword.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => handleEnterKey(event, onClick ? () => onClick(keyword) : undefined)}
                    onClick={() => onClick?.(keyword)}
                    onContextMenu={(event) => onContextMenu?.(event, keyword)}
                    className="group relative list-none rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                    {keyword.name}
                    {keyword.image ? (
                        <img
                            loading="lazy"
                            src={keyword.image.url}
                            alt={keyword.name}
                            className="pointer-events-none absolute -bottom-1 left-full z-20 hidden w-28 rounded-lg border border-slate-200 bg-white shadow-lg group-hover:block"
                        />
                    ) : null}
                </li>
            ))}
        </ul>
    );
};
