import type { MouseEvent } from 'react';

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '~/components/ui/HoverCard';
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
                    {keyword.image ? (
                        <HoverCard openDelay={120} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => onClick?.(keyword)}
                                    onContextMenu={(event) =>
                                        onContextMenu?.(event, keyword)}
                                    className="ui-focus-ring inline-flex items-center rounded-token-md border border-line bg-surface-base px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:bg-surface-muted"
                                >
                                    {keyword.name}
                                </button>
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
                        <button
                            type="button"
                            onClick={() => onClick?.(keyword)}
                            onContextMenu={(event) =>
                                onContextMenu?.(event, keyword)}
                            className="ui-focus-ring inline-flex items-center rounded-token-md border border-line bg-surface-base px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:bg-surface-muted"
                        >
                            {keyword.name}
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
};
