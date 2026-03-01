import { Link } from '@tanstack/react-router';

import { DataIcon, GridIcon, ListIcon } from '~/icons';

const BASE_CLASS_NAME =
    'ui-focus-ring inline-flex h-9 items-center gap-1.5 rounded-token-md px-3 text-sm transition-colors';
const ACTIVE_CLASS_NAME = `${BASE_CLASS_NAME} border border-line bg-surface-base font-semibold text-ink`;
const IDLE_CLASS_NAME = `${BASE_CLASS_NAME} border border-transparent bg-transparent font-medium text-ink-muted hover:text-ink`;
const ACTIVE_OPTIONS = {
    exact: true,
    includeSearch: false,
};

export const CollectionNav = () => {
    return (
        <nav className="flex">
            <div className="inline-flex items-center gap-0.5 rounded-token-lg bg-surface-muted p-1">
                <Link
                    to="/collection"
                    activeOptions={ACTIVE_OPTIONS}
                    className={BASE_CLASS_NAME}
                    activeProps={{ className: ACTIVE_CLASS_NAME }}
                    inactiveProps={{ className: IDLE_CLASS_NAME }}
                >
                    <ListIcon width={13} height={13} />
                    List
                </Link>
                <Link
                    to="/collection/gallery"
                    activeOptions={ACTIVE_OPTIONS}
                    className={BASE_CLASS_NAME}
                    activeProps={{ className: ACTIVE_CLASS_NAME }}
                    inactiveProps={{ className: IDLE_CLASS_NAME }}
                >
                    <GridIcon width={13} height={13} />
                    Grid
                </Link>
                <Link
                    to="/collection/browse"
                    activeOptions={ACTIVE_OPTIONS}
                    className={BASE_CLASS_NAME}
                    activeProps={{ className: ACTIVE_CLASS_NAME }}
                    inactiveProps={{ className: IDLE_CLASS_NAME }}
                >
                    <DataIcon width={13} height={13} />
                    Browse
                </Link>
            </div>
        </nav>
    );
};
