import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DateTimePicker } from './DateTimePicker';

afterEach(() => {
    cleanup();
});

describe('DateTimePicker', () => {
    it('clears selected value with clear button', () => {
        const onChange = vi.fn();

        render(
            <DateTimePicker
                value="2026-03-02T00:00"
                onChange={onChange}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Clear date' }));

        expect(onChange).toHaveBeenCalledWith('');
    });

    it('applies start-of-day boundary when selecting a date', async () => {
        const onChange = vi.fn();

        render(<DateTimePicker value="" boundary="start" onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Select date' }));
        const grid = await screen.findByRole('grid', { name: 'Calendar' });
        const [firstDayButton] = within(grid).getAllByRole('button');
        fireEvent.click(firstDayButton as HTMLButtonElement);

        const selected = onChange.mock.calls[0]?.[0] as string;
        expect(selected).toMatch(/T00:00$/);
    });

    it('applies end-of-day boundary when selecting a date', async () => {
        const onChange = vi.fn();

        render(<DateTimePicker value="" boundary="end" onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Select date' }));
        const grid = await screen.findByRole('grid', { name: 'Calendar' });
        const [firstDayButton] = within(grid).getAllByRole('button');
        fireEvent.click(firstDayButton as HTMLButtonElement);

        const selected = onChange.mock.calls[0]?.[0] as string;
        expect(selected).toMatch(/T23:59$/);
    });
});
