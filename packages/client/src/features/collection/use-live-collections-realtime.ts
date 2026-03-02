import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import type { LiveStatusResponse } from '~/api';
import { collectionQueryKeys } from '~/features/collection/query-keys';

interface UseLiveCollectionsRealtimeOptions {
    onStatus?: (payload: Partial<LiveStatusResponse>) => void;
}

export const useLiveCollectionsRealtime = (options: UseLiveCollectionsRealtimeOptions = {}) => {
    const queryClient = useQueryClient();
    const refreshTimerRef = useRef<number | null>(null);
    const onStatusRef = useRef(options.onStatus);

    useEffect(() => {
        onStatusRef.current = options.onStatus;
    }, [options.onStatus]);

    useEffect(() => {
        const socket = io({
            path: '/socket.io',
        });

        socket.on('live:status', (payload: Partial<LiveStatusResponse>) => {
            onStatusRef.current?.(payload);
        });

        socket.on('live:images', () => {
            if (refreshTimerRef.current !== null) {
                window.clearTimeout(refreshTimerRef.current);
            }

            refreshTimerRef.current = window.setTimeout(() => {
                refreshTimerRef.current = null;
                void Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: collectionQueryKeys.listRoot(),
                        exact: false,
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionQueryKeys.showcaseRoot(),
                        exact: false,
                    }),
                    queryClient.invalidateQueries({
                        queryKey: collectionQueryKeys.modelOptions(),
                        exact: true,
                    }),
                ]);
            }, 250);
        });

        return () => {
            if (refreshTimerRef.current !== null) {
                window.clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            socket.disconnect();
        };
    }, [queryClient]);
};
