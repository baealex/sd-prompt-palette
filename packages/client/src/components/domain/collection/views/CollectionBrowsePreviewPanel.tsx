import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '~/components/ui/DropdownMenu';
import { IconButton } from '~/components/ui/IconButton';
import { Image } from '~/components/ui/Image';
import { Notice } from '~/components/ui/Notice';
import { MoreIcon } from '~/icons';

import type { CollectionBrowseItem } from './collection-browse-types';

interface CollectionBrowsePreviewPanelProps {
    selectedItem: CollectionBrowseItem | null;
    onOpenDetail: (collectionId: number) => void;
    onOpenRename: () => void;
    onOpenDelete: () => void;
}

export const CollectionBrowsePreviewPanel = ({
    selectedItem,
    onOpenDetail,
    onOpenRename,
    onOpenDelete,
}: CollectionBrowsePreviewPanelProps) => {
    return (
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
                                    onOpenDetail(selectedItem.id);
                                }}
                            >
                                Open detail
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <IconButton
                                        icon={<MoreIcon width={16} height={16} />}
                                        label="Browse actions"
                                        variant="secondary"
                                        size="md"
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={8}>
                                    <DropdownMenuItem
                                        onSelect={onOpenRename}
                                    >
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-danger-700 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700"
                                        onSelect={onOpenDelete}
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
    );
};
