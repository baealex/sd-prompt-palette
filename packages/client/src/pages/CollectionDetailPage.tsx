import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { deleteCollection, getCollection, updateCollection } from '~/api';
import { CollectionDetailCard } from '~/components/domain/CollectionDetailCard';
import { PageFrame } from '~/components/domain/PageFrame';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { Notice } from '~/components/ui/Notice';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';

interface CollectionDetailPageProps {
    id: string;
}

export const CollectionDetailPage = ({ id }: CollectionDetailPageProps) => {
    const navigate = useNavigate();
    const { copyToClipboard } = useClipboardToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [titleSaving, setTitleSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
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

    const handleRename = async (nextTitle: string) => {
        if (!collection || titleSaving) {
            return;
        }

        setTitleSaving(true);
        try {
            await updateCollection({ id: collection.id, title: nextTitle.trim() });
            setCollection((prev) => (prev ? { ...prev, title: nextTitle.trim() } : prev));
            setRenameDialogOpen(false);
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

        setRemoving(true);
        try {
            await deleteCollection({ id: collection.id });
            await navigate({ to: '/collection' });
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to delete collection');
        } finally {
            setRemoving(false);
        }
    };

    return (
        <PageFrame surface="plain">
            {loading ? (
                <Notice variant="neutral" className="mb-4">Loading...</Notice>
            ) : null}
            {!loading && collection ? (
                <CollectionDetailCard
                    collection={collection}
                    onClickCopy={(text, label) => {
                        void copyToClipboard(text, { label: label || 'Prompt' });
                    }}
                    onClickRename={() => setRenameDialogOpen(true)}
                    onClickDelete={() => {
                        setRemoveDialogOpen(true);
                    }}
                    renaming={titleSaving}
                    removing={removing}
                />
            ) : null}

            {error ? (
                <Notice variant="error">{error}</Notice>
            ) : null}

            <PromptDialog
                open={renameDialogOpen}
                title="Rename collection"
                description="Use a short title that is easy to scan later."
                defaultValue={collection?.title ?? ''}
                placeholder="Collection title"
                submitting={titleSaving}
                onSubmit={(nextTitle) => {
                    void handleRename(nextTitle);
                }}
                onOpenChange={setRenameDialogOpen}
            />

            <ConfirmDialog
                open={removeDialogOpen}
                title="Delete collection"
                description="This action cannot be undone."
                confirmLabel="Delete"
                confirming={removing}
                danger
                onConfirm={() => {
                    void handleDelete();
                }}
                onOpenChange={setRemoveDialogOpen}
            />
        </PageFrame>
    );
};
