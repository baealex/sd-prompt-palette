import { getPageRange } from '~/modules/page';
import { Button } from '~/components/ui/Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    visiblePages?: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    totalPages,
    visiblePages = 5,
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

    return (
        <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => moveToPage(1)}
                disabled={currentPage <= 1}
            >
                First
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => moveToPage(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                Prev
            </Button>

            {showFirstPage ? (
                <Button
                    size="sm"
                    onClick={() => moveToPage(1)}
                    variant={currentPage === 1 ? 'primary' : 'secondary'}
                    aria-current={currentPage === 1 ? 'page' : undefined}
                >
                    1
                </Button>
            ) : null}

            {showLeadingEllipsis ? (
                <span
                    aria-hidden
                    className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-ink-subtle"
                >
                    …
                </span>
            ) : null}

            {pageRange.map((page) => (
                <Button
                    key={page}
                    size="sm"
                    onClick={() => moveToPage(page)}
                    variant={page === currentPage ? 'primary' : 'secondary'}
                    aria-current={page === currentPage ? 'page' : undefined}
                >
                    {page}
                </Button>
            ))}

            {showTrailingEllipsis ? (
                <span
                    aria-hidden
                    className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-ink-subtle"
                >
                    …
                </span>
            ) : null}

            {showLastPage ? (
                <Button
                    size="sm"
                    onClick={() => moveToPage(totalPages)}
                    variant={currentPage === totalPages ? 'primary' : 'secondary'}
                    aria-current={currentPage === totalPages ? 'page' : undefined}
                >
                    {totalPages}
                </Button>
            ) : null}

            <Button
                variant="secondary"
                size="sm"
                onClick={() => moveToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                Next
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => moveToPage(totalPages)}
                disabled={currentPage >= totalPages}
            >
                Last
            </Button>
        </nav>
    );
};
