import { useNavigate } from '@tanstack/react-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { deleteCollection, updateCollection } from '~/api';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useToast } from '~/components/ui/ToastProvider';

import { CollectionBrowseGalleryPanel } from './CollectionBrowseGalleryPanel';
import { CollectionBrowsePreviewPanel } from './CollectionBrowsePreviewPanel';
import type { CollectionBrowseItem } from './collection-browse-types';

interface CollectionBrowseViewProps {
    items: CollectionBrowseItem[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    selectedId: number | null;
    errorMessage: string | null;
    onPageChange: (nextPage: number) => void;
    onSelectedChange: (nextSelectedId: number | null) => void;
    onRefresh: () => Promise<unknown>;
}

const CollectionBrowseViewComponent = ({
    items,
    loading,
    currentPage,
    totalPages,
    totalItems,
    selectedId,
    errorMessage,
    onPageChange,
    onSelectedChange,
    onRefresh,
}: CollectionBrowseViewProps) => {
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [removing, setRemoving] = useState(false);
    const queryErrorToastRef = useRef<string | null>(null);

    useEffect(() => {
        if (!errorMessage) {
            queryErrorToastRef.current = null;
            return;
        }
        if (queryErrorToastRef.current === errorMessage) {
            return;
        }
        queryErrorToastRef.current = errorMessage;
        pushToast({
            variant: 'error',
            message: errorMessage,
        });
    }, [errorMessage, pushToast]);

    useEffect(() => {
        if (items.length === 0) {
            if (selectedId !== null) {
                onSelectedChange(null);
            }
            return;
        }

        if (selectedId && items.some((item) => item.id === selectedId)) {
            return;
        }

        onSelectedChange(items[0].id);
    }, [items, onSelectedChange, selectedId]);

    const selectedItem = useMemo(() => {
        if (!selectedId) {
            return null;
        }
        return items.find((item) => item.id === selectedId) ?? null;
    }, [items, selectedId]);

    const openDetail = (collectionId: number) => {
        void navigate({
            to: '/collection/$id',
            params: { id: String(collectionId) },
        });
    };

    const handleRename = async (nextTitle: string) => {
        if (!selectedItem || renaming) {
            return;
        }

        const normalizedTitle = nextTitle.trim();
        if (!normalizedTitle) {
            return;
        }

        setRenaming(true);
        try {
            await updateCollection({
                id: selectedItem.id,
                title: normalizedTitle,
            });
            setRenameDialogOpen(false);
            pushToast({
                variant: 'success',
                message: 'Collection renamed.',
            });
            await onRefresh();
        } catch (nextError) {
            pushToast({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to rename collection',
            });
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem || removing) {
            return;
        }

        setRemoving(true);
        try {
            await deleteCollection({ id: selectedItem.id });
            setRemoveDialogOpen(false);
            pushToast({
                variant: 'success',
                message: 'Collection deleted.',
            });
            await onRefresh();
        } catch (nextError) {
            pushToast({
                variant: 'error',
                message:
                    nextError instanceof Error
                        ? nextError.message
                        : 'Failed to delete collection',
            });
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
                <CollectionBrowseGalleryPanel
                    items={items}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    selectedId={selectedId}
                    onPageChange={onPageChange}
                    onSelectedChange={onSelectedChange}
                />

                <CollectionBrowsePreviewPanel
                    selectedItem={selectedItem}
                    onOpenDetail={openDetail}
                    onOpenRename={() => {
                        setRenameDialogOpen(true);
                    }}
                    onOpenDelete={() => {
                        setRemoveDialogOpen(true);
                    }}
                />
            </div>

            <PromptDialog
                open={renameDialogOpen}
                title="Rename collection"
                description="Use a title that is easy to scan later."
                defaultValue={selectedItem?.title ?? ''}
                placeholder="Collection title"
                confirmLabel="Save"
                submitting={renaming}
                onSubmit={(nextTitle) => {
                    void handleRename(nextTitle);
                }}
                onOpenChange={(open) => {
                    setRenameDialogOpen(open);
                }}
            />

            <ConfirmDialog
                open={removeDialogOpen}
                title="Delete collection"
                description={
                    selectedItem
                        ? `"${selectedItem.title || '(untitled)'}" will be permanently removed.`
                        : 'This collection will be removed.'
                }
                confirmLabel="Delete"
                confirming={removing}
                danger
                onConfirm={() => {
                    void handleDelete();
                }}
                onOpenChange={(open) => {
                    setRemoveDialogOpen(open);
                }}
            />
        </>
    );
};

export const CollectionBrowseView = memo(CollectionBrowseViewComponent);
CollectionBrowseView.displayName = 'CollectionBrowseView';
