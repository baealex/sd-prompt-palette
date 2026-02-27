import { useEffect, useMemo, useState } from 'react';

import { deleteCollection, getCollection, updateCollection } from '~/api';
import { CollectionCard } from '~/components/domain/CollectionCard';
import { PageFrame } from '~/components/domain/PageFrame';

const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

interface CollectionDetailPageProps {
    id: string;
}

export const CollectionDetailPage = ({ id }: CollectionDetailPageProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [titleSaving, setTitleSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [collection, setCollection] = useState<Awaited<ReturnType<typeof getCollection>>['data']['collection'] | null>(null);

    const collectionId = useMemo(() => Number(id), [id]);

    useEffect(() => {
        if (Number.isNaN(collectionId)) {
            setError('Invalid collection id');
            setLoading(false);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getCollection({ id: collectionId });
                if (cancelled) {
                    return;
                }
                setCollection(response.data.collection);
            } catch (nextError) {
                if (cancelled) {
                    return;
                }
                setError(nextError instanceof Error ? nextError.message : 'Failed to load collection');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [collectionId]);

    const handleRename = async () => {
        if (!collection || titleSaving) {
            return;
        }

        const nextTitle = window.prompt('Enter a new title', collection.title);
        if (!nextTitle || !nextTitle.trim()) {
            return;
        }

        setTitleSaving(true);
        try {
            await updateCollection({ id: collection.id, title: nextTitle.trim() });
            setCollection((prev) => (prev ? { ...prev, title: nextTitle.trim() } : prev));
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to rename collection');
        } finally {
            setTitleSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!collection || removing) {
            return;
        }

        const confirmed = window.confirm('Are you sure you want to delete this collection?');
        if (!confirmed) {
            return;
        }

        setRemoving(true);
        try {
            await deleteCollection({ id: collection.id });
            window.location.assign('/collection');
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to delete collection');
        } finally {
            setRemoving(false);
        }
    };

    return (
        <PageFrame
            title={`Collection Detail #${id}`}
            description="Single collection detail view."
        >
            {loading ? <p className="text-sm text-slate-600">Loading...</p> : null}
            {!loading && collection ? (
                <CollectionCard
                    collection={collection}
                    onClickCopy={(text) => {
                        void copyText(text);
                    }}
                    onClickRename={() => {
                        void handleRename();
                    }}
                    onClickDelete={() => {
                        void handleDelete();
                    }}
                    renaming={titleSaving}
                    removing={removing}
                />
            ) : null}

            {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}
        </PageFrame>
    );
};
