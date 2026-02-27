import { useEffect, useState } from 'react';

import { getCollections } from '~/api';
import { PageFrame } from '~/components/domain/PageFrame';
import { useContextMenu } from '~/modules/ui/context-menu';
import type { Collection } from '~/models/types';

export const CollectionListPage = () => {
    const [items, setItems] = useState<Array<Pick<Collection, 'id' | 'title'>>>([]);
    const [error, setError] = useState<string | null>(null);
    const contextMenu = useContextMenu();

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const response = await getCollections({ page: 1, limit: 20 });
                if (cancelled) {
                    return;
                }

                setItems(response.data.allCollections.collections.map((item) => ({
                    id: item.id,
                    title: item.title,
                })));
                setError(null);
            } catch (nextError) {
                if (cancelled) {
                    return;
                }
                setError(nextError instanceof Error ? nextError.message : 'Failed to load collections');
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <PageFrame
            title="Collection"
            description="Collection API and context-menu state abstraction verification."
        >
            <ul className="space-y-2">
                {items.map((item) => (
                    <li
                        key={item.id}
                        onContextMenu={(event) => {
                            contextMenu.open(event, [
                                { label: 'Rename' },
                                { label: 'Remove' },
                            ]);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                        #{item.id} {item.title || '(untitled)'}
                    </li>
                ))}
            </ul>

            {contextMenu.state.open ? (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Context menu state opened at ({Math.round(contextMenu.state.left)}, {Math.round(contextMenu.state.top)})
                    <button
                        type="button"
                        onClick={contextMenu.close}
                        className="ml-3 rounded-md border border-amber-300 px-2 py-1 text-xs hover:bg-amber-100"
                    >
                        Close
                    </button>
                </div>
            ) : null}

            {error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}
        </PageFrame>
    );
};
