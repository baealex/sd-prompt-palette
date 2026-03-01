import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { deleteCollection, updateCollection } from '~/api';
import { CollectionCard } from '~/components/domain/CollectionCard';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { Notice } from '~/components/ui/Notice';
import { Pagination } from '~/components/ui/Pagination';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';
import type { Collection } from '~/models/types';

type CollectionListItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;

interface CollectionListViewProps {
    items: CollectionListItem[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    errorMessage: string | null;
    onPageChange: (nextPage: number) => void;
    onRefresh: () => Promise<unknown>;
}

export const CollectionListView = ({
    items,
    loading,
    currentPage,
    totalPages,
    totalItems,
    errorMessage,
    onPageChange,
    onRefresh,
}: CollectionListViewProps) => {
    const navigate = useNavigate();
    const { copyToClipboard } = useClipboardToast();
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [renameTarget, setRenameTarget] = useState<CollectionListItem | null>(
        null,
    );
    const [removeTarget, setRemoveTarget] = useState<CollectionListItem | null>(
        null,
    );

    const handleOpenDetail = (id: number) => {
        void navigate({
            to: '/collection/$id',
            params: { id: String(id) },
        });
    };

    const handleRename = async (nextTitle: string) => {
        if (!renameTarget || !nextTitle.trim()) {
            return;
        }

        setRenamingId(renameTarget.id);
        try {
            await updateCollection({
                id: renameTarget.id,
                title: nextTitle.trim(),
            });
            setMutationError(null);
            setRenameTarget(null);
        } catch (nextError) {
            setMutationError(
                nextError instanceof Error
                    ? nextError.message
                    : 'Failed to rename collection',
            );
            setRenamingId(null);
            return;
        }

        try {
            await onRefresh();
        } catch {
            setMutationError('Collection renamed, but refresh failed.');
        }

        setRenamingId(null);
    };

    const handleDelete = async () => {
        if (!removeTarget) {
            return;
        }

        setRemovingId(removeTarget.id);
        try {
            await deleteCollection({ id: removeTarget.id });
            setMutationError(null);
            setRemoveTarget(null);
        } catch (nextError) {
            setMutationError(
                nextError instanceof Error
                    ? nextError.message
                    : 'Failed to delete collection',
            );
            setRemovingId(null);
            return;
        }

        try {
            await onRefresh();
        } catch {
            setMutationError('Collection deleted, but refresh failed.');
        }

        setRemovingId(null);
    };

    const displayError = mutationError ?? errorMessage;

    return (
        <>
            {loading && items.length === 0 ? (
                <Notice variant="neutral">Loading collections...</Notice>
            ) : null}

            {!loading && items.length === 0 ? (
                <Notice variant="neutral">No collections found.</Notice>
            ) : null}

            <div>
                {items.map((item) => (
                    <CollectionCard
                        key={item.id}
                        collection={item}
                        onClickCopy={(text, label = 'Prompt') => {
                            void copyToClipboard(text, { label });
                        }}
                        onClickOpenDetail={() => {
                            handleOpenDetail(item.id);
                        }}
                        onClickRename={() => {
                            setRenameTarget(item);
                        }}
                        onClickDelete={() => {
                            setRemoveTarget(item);
                        }}
                        renaming={renamingId === item.id}
                        removing={removingId === item.id}
                    />
                ))}
            </div>

            {items.length > 0 && totalPages > 1 ? (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={20}
                    onPageChange={onPageChange}
                />
            ) : null}

            {items.length > 0 ? (
                <p className="mt-2 text-xs text-ink-muted">
                    {totalItems} collections total
                </p>
            ) : null}

            {displayError ? (
                <Notice variant="error" className="mt-4">
                    {displayError}
                </Notice>
            ) : null}

            <PromptDialog
                open={renameTarget !== null}
                title="Rename collection"
                description="Use a title that is easy to scan later."
                defaultValue={renameTarget?.title ?? ''}
                placeholder="Collection title"
                submitting={
                    renameTarget !== null && renamingId === renameTarget.id
                }
                onSubmit={(nextTitle) => {
                    void handleRename(nextTitle);
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameTarget(null);
                    }
                }}
            />

            <ConfirmDialog
                open={removeTarget !== null}
                title="Delete collection"
                description={
                    removeTarget
                        ? `"${removeTarget.title || '(untitled)'}" will be permanently removed.`
                        : 'This collection will be removed.'
                }
                confirmLabel="Delete"
                confirming={
                    removeTarget !== null && removingId === removeTarget.id
                }
                danger
                onConfirm={() => {
                    void handleDelete();
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        setRemoveTarget(null);
                    }
                }}
            />
        </>
    );
};
