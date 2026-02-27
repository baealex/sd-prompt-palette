import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';

describe('Pagination', () => {
    it('renders current page and handles navigation clicks', () => {
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={3}
                totalPages={10}
                visiblePages={5}
                onPageChange={onPageChange}
            />,
        );

        expect(screen.getByRole('button', { name: '3' })).toHaveTextContent('3');
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('keeps buttons keyboard focusable', () => {
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={1}
                totalPages={3}
                onPageChange={onPageChange}
            />,
        );

        const nextButton = screen.getByRole('button', { name: 'Next' });
        nextButton.focus();

        expect(nextButton).toHaveFocus();
    });
});
