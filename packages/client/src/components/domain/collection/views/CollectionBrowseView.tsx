import { useNavigate } from '@tanstack/react-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { deleteCollection, updateCollection } from '~/api';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { IconButton } from '~/components/ui/IconButton';
import { Image } from '~/components/ui/Image';
import { MasonryColumns } from '~/components/ui/MasonryColumns';
import { Notice } from '~/components/ui/Notice';
import { Pagination } from '~/components/ui/Pagination';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useToast } from '~/components/ui/ToastProvider';
import { MoreIcon } from '~/icons';
import type { Collection } from '~/models/types';

const BROWSE_GALLERY_BREAKPOINTS = [
    { minWidth: 360, columns: 3 },
    { minWidth: 240, columns: 2 },
    { minWidth: 0, columns: 1 },
];

type CollectionBrowseItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;

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
    const galleryScrollRef = useRef<HTMLDivElement | null>(null);
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
        galleryScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }, [currentPage]);

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
                <Card className="order-2 h-fit xl:order-1 xl:sticky xl:top-20 xl:self-start">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-ink">
                                Gallery
                            </h2>
                            <Badge variant="neutral">
                                Page {currentPage}/{totalPages}
                            </Badge>
                        </div>
                    </div>
                    <p className="mb-3 text-xs text-ink-muted xl:hidden">
                        Tap a thumbnail to update the preview card above.
                    </p>

                    {loading && items.length === 0 ? (
                        <Notice variant="neutral">
                            Loading collections...
                        </Notice>
                    ) : null}

                    {!loading && items.length === 0 ? (
                        <Notice variant="neutral">No collections found.</Notice>
                    ) : null}

                    {items.length > 0 ? (
                        <div
                            ref={galleryScrollRef}
                            className="xl:max-h-[62vh] xl:overflow-y-auto xl:pr-1"
                        >
                            <MasonryColumns
                                items={items}
                                breakpoints={BROWSE_GALLERY_BREAKPOINTS}
                                breakpointMode="container"
                                className="grid gap-1.5"
                                columnClassName="space-y-1.5"
                                getItemKey={(item) => item.id}
                                renderItem={(item) => (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onSelectedChange(item.id);
                                        }}
                                        className={`!h-auto w-full !justify-start gap-0 border p-1.5 text-left transition-colors ${
                                            selectedId === item.id
                                                ? 'border-brand-400 bg-brand-50 shadow-surface'
                                                : 'border-line bg-surface-raised hover:border-brand-200 hover:bg-surface-muted'
                                        }`}
                                    >
                                        <div className="w-full overflow-hidden rounded-token-sm border border-line bg-surface-muted">
                                            <Image
                                                src={item.image.url}
                                                alt={item.title || '(untitled)'}
                                                width={item.image.width}
                                                height={item.image.height}
                                                className="block h-auto w-full"
                                            />
                                        </div>
                                    </Button>
                                )}
                            />
                        </div>
                    ) : null}

                    {items.length > 0 && totalPages > 1 ? (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            variant="compact"
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
                </Card>

                <Card className="order-1 h-fit xl:order-2 xl:sticky xl:top-20 xl:self-start xl:min-h-[68vh]">
                    {selectedItem ? (
                        <>
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-semibold text-ink">
                                        {selectedItem.title || '(untitled)'}
                                    </h2>
                                    <p className="mt-1 text-xs text-ink-muted">
                                        Collection #{selectedItem.id}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            openDetail(selectedItem.id);
                                        }}
                                    >
                                        Open detail
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <IconButton
                                                icon={
                                                    <MoreIcon
                                                        width={16}
                                                        height={16}
                                                    />
                                                }
                                                label="Browse actions"
                                                variant="secondary"
                                                size="md"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" sideOffset={8}>
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    setRenameDialogOpen(true);
                                                }}
                                            >
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-danger-700 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700"
                                                onSelect={() => {
                                                    setRemoveDialogOpen(true);
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-token-lg border border-line bg-surface-muted">
                                <Image
                                    src={selectedItem.image.url}
                                    alt={selectedItem.title || '(untitled)'}
                                    width={selectedItem.image.width}
                                    height={selectedItem.image.height}
                                    className="block max-h-[52vh] w-full object-contain sm:max-h-[62vh] xl:max-h-[70vh]"
                                />
                            </div>
                        </>
                    ) : (
                        <Notice variant="neutral">
                            Select a collection from the gallery to preview it.
                        </Notice>
                    )}
                </Card>
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
