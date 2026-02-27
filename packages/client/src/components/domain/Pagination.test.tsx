import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';

afterEach(() => {
    cleanup();
});

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

        expect(screen.getByRole('button', { name: '3' })).toHaveTextContent(
            '3',
        );
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('supports first and last page jumps', () => {
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={4}
                totalPages={10}
                visiblePages={5}
                onPageChange={onPageChange}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'First' }));
        fireEvent.click(screen.getByRole('button', { name: 'Last' }));

        expect(onPageChange).toHaveBeenCalledWith(1);
        expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('renders ellipsis when there is a gap in page ranges', () => {
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={5}
                totalPages={20}
                visiblePages={5}
                onPageChange={onPageChange}
            />,
        );

        expect(screen.getAllByText('...')).toHaveLength(2);
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

    it('shows page status and item range copy', () => {
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={3}
                totalPages={10}
                totalItems={194}
                itemsPerPage={20}
                onPageChange={onPageChange}
            />,
        );

        expect(screen.getByText('Page 3 of 10')).toBeInTheDocument();
        expect(screen.getByText('41-60 of 194')).toBeInTheDocument();
    });

    it('renders compact controls without first/last and page numbers', () => {
        const onPageChange = vi.fn();

        render(
            <Pagination
                currentPage={2}
                totalPages={10}
                variant="compact"
                onPageChange={onPageChange}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'First' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Last' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: '2' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('2 / 10')).toBeInTheDocument();
    });

    it('does not render controls when only one page exists', () => {
        const onPageChange = vi.fn();

        const { container } = render(
            <Pagination
                currentPage={1}
                totalPages={1}
                onPageChange={onPageChange}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
