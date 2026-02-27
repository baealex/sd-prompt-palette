import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getLiveConfig, syncLiveImages, updateLiveConfig } from '~/api';
import { ToastProvider } from '~/components/ui/ToastProvider';

import { CollectionRealtimeControl } from './CollectionRealtimeControl';

vi.mock('~/api', () => ({
    getLiveConfig: vi.fn(),
    listLiveDirectories: vi.fn(),
    syncLiveImages: vi.fn(),
    updateLiveConfig: vi.fn(),
}));

vi.mock('~/features/collection/use-live-collections-realtime', () => ({
    useLiveCollectionsRealtime: vi.fn(),
}));

const mockedGetLiveConfig = vi.mocked(getLiveConfig);
const mockedSyncLiveImages = vi.mocked(syncLiveImages);
const mockedUpdateLiveConfig = vi.mocked(updateLiveConfig);

const createConfig = (overrides: Partial<{
    watchDir: string;
    ingestMode: 'copy' | 'move';
    deleteSourceOnDelete: boolean;
    enabled: boolean;
    updatedAt: number;
}> = {}) => ({
    watchDir: '',
    ingestMode: 'copy' as const,
    deleteSourceOnDelete: false,
    enabled: false,
    updatedAt: 1,
    ...overrides,
});

const mockGetLiveConfigOnce = (config: ReturnType<typeof createConfig>) => {
    mockedGetLiveConfig.mockResolvedValueOnce({
        data: {
            ok: true,
            config,
            status: {
                ok: true,
                watchDir: config.watchDir,
                libraryDir: 'D:\\library',
                ingestMode: config.ingestMode,
                initialized: true,
            },
        },
    } as never);
};

const renderControl = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <CollectionRealtimeControl />
            </ToastProvider>
        </QueryClientProvider>,
    );
};

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

beforeEach(() => {
    mockedSyncLiveImages.mockResolvedValue({
        data: { ok: true, scanned: 0 },
    } as never);
});

describe('CollectionRealtimeControl', () => {
    it('blocks enabling Auto Collect when Watch Folder is empty', async () => {
        mockGetLiveConfigOnce(createConfig({ watchDir: '', enabled: false }));

        renderControl();

        const toggle = await screen.findByRole('switch', { name: 'Auto Collect' });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(toggle);

        expect(await screen.findByText('Set a Watch Folder before enabling Auto Collect.')).toBeInTheDocument();
        expect(await screen.findByText('Auto Collect Settings')).toBeInTheDocument();
        expect(mockedUpdateLiveConfig).not.toHaveBeenCalled();
    });

    it('runs manual collect and shows success feedback', async () => {
        mockGetLiveConfigOnce(createConfig({ watchDir: 'D:\\watch', enabled: true }));
        mockedSyncLiveImages.mockResolvedValueOnce({
            data: { ok: true, scanned: 7 },
        } as never);

        renderControl();

        const toggle = await screen.findByRole('switch', { name: 'Auto Collect' });
        expect(toggle).toHaveAttribute('aria-checked', 'true');
        fireEvent.click(screen.getByRole('button', { name: 'Collect now' }));

        await waitFor(() => {
            expect(mockedSyncLiveImages).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText('Collect completed (7 scanned)')).toBeInTheDocument();
    });
});
