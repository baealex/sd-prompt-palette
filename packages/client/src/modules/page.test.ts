import { describe, expect, it } from 'vitest';

import { getPageRange } from './page';

describe('getPageRange', () => {
    it('returns centered range when possible', () => {
        const range = getPageRange({
            currentPage: 5,
            totalPages: 10,
            visiblePages: 5,
        });

        expect(range).toEqual([3, 4, 5, 6, 7]);
    });

    it('returns lower bound range near first page', () => {
        const range = getPageRange({
            currentPage: 1,
            totalPages: 10,
            visiblePages: 5,
        });

        expect(range).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns upper bound range near last page', () => {
        const range = getPageRange({
            currentPage: 10,
            totalPages: 10,
            visiblePages: 5,
        });

        expect(range).toEqual([6, 7, 8, 9, 10]);
    });
});
