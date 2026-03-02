import { useEffect, useRef } from 'react';

import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Image } from '~/components/ui/Image';
import { MasonryColumns } from '~/components/ui/MasonryColumns';
import { Notice } from '~/components/ui/Notice';
import { Pagination } from '~/components/ui/Pagination';

import {
    BROWSE_GALLERY_BREAKPOINTS,
    type CollectionBrowseItem,
} from './collection-browse-types';

interface CollectionBrowseGalleryPanelProps {
    items: CollectionBrowseItem[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    selectedId: number | null;
    onPageChange: (nextPage: number) => void;
    onSelectedChange: (nextSelectedId: number | null) => void;
}

export const CollectionBrowseGalleryPanel = ({
    items,
    loading,
    currentPage,
    totalPages,
    totalItems,
    selectedId,
    onPageChange,
    onSelectedChange,
}: CollectionBrowseGalleryPanelProps) => {
    const galleryScrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        galleryScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }, [currentPage]);

    return (
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
                <Notice variant="neutral">Loading collections...</Notice>
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
    );
};
