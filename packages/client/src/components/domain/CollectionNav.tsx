import { DataIcon, GridIcon, ListIcon } from '~/icons';
import type { CollectionView } from '~/features/collection/view-filter';

const BASE_CLASS_NAME =
    'ui-focus-ring inline-flex h-11 items-center gap-1.5 rounded-token-md px-3 text-sm transition-colors';
const ACTIVE_CLASS_NAME = `${BASE_CLASS_NAME} border border-line bg-surface-raised font-semibold text-ink`;
const IDLE_CLASS_NAME = `${BASE_CLASS_NAME} border border-transparent bg-transparent font-medium text-ink-muted hover:text-ink`;

interface CollectionNavProps {
    view: CollectionView;
    onViewChange: (view: CollectionView) => void;
}

export const CollectionNav = ({ view, onViewChange }: CollectionNavProps) => {
    return (
        <nav className="flex" aria-label="Collection view tabs">
            <div className="inline-flex items-center gap-0.5 rounded-token-lg bg-surface-muted p-1">
                <button
                    type="button"
                    className={view === 'list' ? ACTIVE_CLASS_NAME : IDLE_CLASS_NAME}
                    aria-pressed={view === 'list'}
                    onClick={() => onViewChange('list')}
                >
                    <ListIcon width={13} height={13} />
                    List
                </button>
                <button
                    type="button"
                    className={view === 'gallery' ? ACTIVE_CLASS_NAME : IDLE_CLASS_NAME}
                    aria-pressed={view === 'gallery'}
                    onClick={() => onViewChange('gallery')}
                >
                    <GridIcon width={13} height={13} />
                    Grid
                </button>
                <button
                    type="button"
                    className={view === 'browse' ? ACTIVE_CLASS_NAME : IDLE_CLASS_NAME}
                    aria-pressed={view === 'browse'}
                    onClick={() => onViewChange('browse')}
                >
                    <DataIcon width={13} height={13} />
                    Browse
                </button>
            </div>
        </nav>
    );
};
