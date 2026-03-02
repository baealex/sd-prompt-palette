import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCategories } from '~/api';
import { ToastProvider } from '~/components/ui/ToastProvider';
import { clearMemoStore } from '~/modules/memo';

import { IdeaPage } from './IdeaPage';

vi.mock('~/api', () => ({
    getCategories: vi.fn(),
}));

const mockedGetCategories = vi.mocked(getCategories);

const categoriesResponse = {
    data: {
        allCategories: [
            {
                id: 1,
                name: 'Style',
                order: 1,
                keywords: [{ id: 101, name: 'Noir' }],
            },
            {
                id: 2,
                name: 'Style',
                order: 2,
                keywords: [{ id: 102, name: 'Pastel' }],
            },
        ],
    },
};

const renderIdeaPage = () =>
    render(
        <ToastProvider>
            <IdeaPage />
        </ToastProvider>,
    );

beforeEach(() => {
    clearMemoStore();
    window.sessionStorage.clear();
    vi.clearAllMocks();
    mockedGetCategories.mockResolvedValue(
        categoriesResponse as never,
    );
});

afterEach(() => {
    cleanup();
});

describe('IdeaPage', () => {
    it('keeps selection distinct by id even with duplicate category names', async () => {
        renderIdeaPage();

        const checkboxes = await screen.findAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);

        fireEvent.click(checkboxes[1] as HTMLInputElement);
        expect(screen.getByText('1/2 selected')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Generate ideas' }));

        expect(await screen.findByText('Noir')).toBeInTheDocument();
        expect(screen.queryByText('Pastel')).not.toBeInTheDocument();
    });

    it('restores selection from session storage after reload', async () => {
        const firstRender = renderIdeaPage();

        const checkboxes = await screen.findAllByRole('checkbox');
        fireEvent.click(checkboxes[1] as HTMLInputElement);

        firstRender.unmount();
        clearMemoStore();

        renderIdeaPage();

        const restored = await screen.findAllByRole('checkbox');
        expect(restored[0]).toBeChecked();
        expect(restored[1]).not.toBeChecked();
    });
});
