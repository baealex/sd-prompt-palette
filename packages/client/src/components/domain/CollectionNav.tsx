import { Link } from '@tanstack/react-router';

import { GridIcon, ImageIcon, ListIcon } from '~/icons';

const BASE_CLASS_NAME = 'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition';
const ACTIVE_CLASS_NAME = `${BASE_CLASS_NAME} border-brand-700 bg-brand-700 font-semibold text-white shadow-sm`;
const IDLE_CLASS_NAME = `${BASE_CLASS_NAME} border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-100`;
const ACTIVE_OPTIONS = {
    exact: true,
    includeSearch: false,
};

export const CollectionNav = () => {
    return (
        <nav className="mb-5 flex flex-wrap justify-end gap-2">
            <Link
                to="/collection"
                activeOptions={ACTIVE_OPTIONS}
                className={BASE_CLASS_NAME}
                activeProps={{ className: ACTIVE_CLASS_NAME }}
                inactiveProps={{ className: IDLE_CLASS_NAME }}
            >
                <ListIcon width={14} height={14} />
                List
            </Link>
            <Link
                to="/collection/gallery"
                activeOptions={ACTIVE_OPTIONS}
                className={BASE_CLASS_NAME}
                activeProps={{ className: ACTIVE_CLASS_NAME }}
                inactiveProps={{ className: IDLE_CLASS_NAME }}
            >
                <GridIcon width={14} height={14} />
                Grid
            </Link>
            <Link
                to="/collection/slide-show"
                activeOptions={ACTIVE_OPTIONS}
                className={BASE_CLASS_NAME}
                activeProps={{ className: ACTIVE_CLASS_NAME }}
                inactiveProps={{ className: IDLE_CLASS_NAME }}
            >
                <ImageIcon width={14} height={14} />
                Show
            </Link>
        </nav>
    );
};
