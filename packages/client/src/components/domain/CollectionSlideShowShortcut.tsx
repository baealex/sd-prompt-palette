import { Link } from '@tanstack/react-router';

import { ImageIcon } from '~/icons';

export const CollectionSlideShowShortcut = () => {
    return (
        <Link
            to="/collection/slide-show"
            className="ui-focus-ring inline-flex h-9 items-center gap-1.5 rounded-token-md border border-line bg-surface-base px-3 text-sm font-medium text-ink-muted shadow-surface transition-colors hover:bg-surface-muted"
        >
            <ImageIcon width={14} height={14} />
            Slide Show
        </Link>
    );
};
