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
    const pageRange = getPageRange({
        currentPage,
        totalPages,
        visiblePages,
    });

    const moveToPage = (page: number) => {
        if (page < 1 || page > totalPages) {
            return;
        }
        onPageChange(page);
    };

    return (
        <nav className="mt-4 flex flex-wrap items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => moveToPage(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                Prev
            </Button>

            {pageRange.map((page) => (
                <Button
                    key={page}
                    size="sm"
                    onClick={() => moveToPage(page)}
                    variant={page === currentPage ? 'primary' : 'secondary'}
                >
                    {page}
                </Button>
            ))}

            <Button
                variant="secondary"
                size="sm"
                onClick={() => moveToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                Next
            </Button>
        </nav>
    );
};
