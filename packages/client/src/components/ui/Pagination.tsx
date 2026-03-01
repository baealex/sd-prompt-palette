import { useMemo } from 'react';

import { ArrowLeftIcon, ArrowRightIcon } from '~/icons';
import { getPageRange } from '~/modules/page';
import { Button } from '~/components/ui/Button';

type PaginationVariant = 'standard' | 'compact';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    variant?: PaginationVariant;
    visiblePages?: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    totalPages,
    variant = 'standard',
    visiblePages = 5,
    totalItems,
    itemsPerPage,
    onPageChange,
}: PaginationProps) => {
    if (totalPages <= 1) {
        return null;
    }

    const pageRange = getPageRange({
        currentPage,
        totalPages,
        visiblePages,
    });
    const firstVisiblePage = pageRange[0] ?? 1;
    const lastVisiblePage = pageRange[pageRange.length - 1] ?? totalPages;
    const showFirstPage = firstVisiblePage > 1;
    const showLastPage = lastVisiblePage < totalPages;
    const showLeadingEllipsis = firstVisiblePage > 2;
    const showTrailingEllipsis = lastVisiblePage < totalPages - 1;

    const moveToPage = (page: number) => {
        if (page < 1 || page > totalPages) {
            return;
        }
        onPageChange(page);
    };

    const itemRangeText = useMemo(() => {
        if (
            typeof totalItems !== 'number' ||
            !Number.isFinite(totalItems) ||
            totalItems <= 0 ||
            typeof itemsPerPage !== 'number' ||
            !Number.isFinite(itemsPerPage) ||
            itemsPerPage <= 0
        ) {
            return null;
        }

        const start = Math.max(1, (currentPage - 1) * itemsPerPage + 1);
        const end = Math.min(totalItems, currentPage * itemsPerPage);
        return `${start}-${end} of ${totalItems}`;
    }, [currentPage, itemsPerPage, totalItems]);

    if (variant === 'compact') {
        return (
            <nav
                aria-label="Pagination"
                className="mt-4 rounded-token-md border border-line bg-surface-base p-2 shadow-surface"
            >
                <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink-muted">
                        Page {currentPage} of {totalPages}
                    </p>
                    {itemRangeText ? (
                        <p className="text-xs text-ink-subtle">
                            {itemRangeText}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => moveToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Prev
                    </Button>

                    <div className="inline-flex h-10 min-w-[88px] items-center justify-center rounded-token-md border border-line bg-surface-muted px-3 text-xs font-semibold text-ink">
                        {currentPage} / {totalPages}
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => moveToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            </nav>
        );
    }

    return (
        <nav
            aria-label="Pagination"
            className="mt-4 rounded-token-md border border-line bg-surface-base p-3 shadow-surface md:p-4"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink-muted">
                    Page {currentPage} of {totalPages}
                </p>
                {itemRangeText ? (
                    <p className="text-xs text-ink-subtle">{itemRangeText}</p>
                ) : null}
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    size="md"
                    className="flex-1 sm:min-w-[120px] sm:flex-none"
                    onClick={() => moveToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ArrowLeftIcon width={14} height={14} />
                    Prev
                </Button>

                <div className="hidden min-w-0 flex-1 items-center justify-center gap-2.5 sm:flex">
                    {showFirstPage ? (
                        <Button
                            size="md"
                            onClick={() => moveToPage(1)}
                            variant={
                                currentPage === 1 ? 'primary' : 'secondary'
                            }
                            aria-current={
                                currentPage === 1 ? 'page' : undefined
                            }
                            aria-label="Go to page 1"
                        >
                            1
                        </Button>
                    ) : null}

                    {showLeadingEllipsis ? (
                        <span
                            aria-hidden
                            className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-ink-subtle"
                        >
                            ...
                        </span>
                    ) : null}

                    {pageRange.map((page) => (
                        <Button
                            key={page}
                            size="md"
                            onClick={() => moveToPage(page)}
                            variant={
                                page === currentPage ? 'primary' : 'secondary'
                            }
                            aria-current={
                                page === currentPage ? 'page' : undefined
                            }
                            aria-label={`Go to page ${page}`}
                        >
                            {page}
                        </Button>
                    ))}

                    {showTrailingEllipsis ? (
                        <span
                            aria-hidden
                            className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-ink-subtle"
                        >
                            ...
                        </span>
                    ) : null}

                    {showLastPage ? (
                        <Button
                            size="md"
                            onClick={() => moveToPage(totalPages)}
                            variant={
                                currentPage === totalPages
                                    ? 'primary'
                                    : 'secondary'
                            }
                            aria-current={
                                currentPage === totalPages ? 'page' : undefined
                            }
                            aria-label={`Go to page ${totalPages}`}
                        >
                            {totalPages}
                        </Button>
                    ) : null}
                </div>

                <div className="inline-flex min-w-[108px] items-center justify-center rounded-token-md border border-line bg-surface-muted px-3 py-2 text-xs font-semibold text-ink sm:hidden">
                    {currentPage} / {totalPages}
                </div>

                <Button
                    variant="secondary"
                    size="md"
                    className="flex-1 sm:min-w-[120px] sm:flex-none"
                    onClick={() => moveToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ArrowRightIcon width={14} height={14} />
                </Button>
            </div>
        </nav>
    );
};
