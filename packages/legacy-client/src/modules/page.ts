interface GetPageRangeParams {
    currentPage: number;
    totalPages: number;
    visiblePages: number;
}

export const getPageRange = ({
    currentPage,
    totalPages,
    visiblePages,
}: GetPageRangeParams) => {
    const totalVisiblePages = Math.min(visiblePages, totalPages);
    const halfVisiblePages = Math.floor(totalVisiblePages / 2);

    let startPage = currentPage - halfVisiblePages;
    let endPage = currentPage + halfVisiblePages;

    if (startPage < 1) {
        endPage -= startPage - 1;
        startPage = 1;
    }

    if (endPage > totalPages) {
        startPage -= endPage - totalPages;
        endPage = totalPages;
    }

    if (startPage < 1) {
        startPage = 1;
    }

    return Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
    );
};