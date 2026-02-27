import { getPageRange } from '~/modules/page';

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
            <button
                type="button"
                onClick={() => moveToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Prev
            </button>

            {pageRange.map((page) => (
                <button
                    key={page}
                    type="button"
                    onClick={() => moveToPage(page)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                        page === currentPage
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {page}
                </button>
            ))}

            <button
                type="button"
                onClick={() => moveToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Next
            </button>
        </nav>
    );
};
