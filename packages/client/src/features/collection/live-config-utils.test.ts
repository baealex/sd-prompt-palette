import { describe, expect, it } from 'vitest';

import { mergeLiveConfig } from './live-config-utils';

describe('mergeLiveConfig', () => {
    it('keeps previous ingestMode when payload does not include ingestMode', () => {
        const current = {
            watchDir: 'D:\\watch',
            ingestMode: 'move' as const,
            deleteSourceOnDelete: false,
            enabled: true,
            updatedAt: 100,
        };

        const merged = mergeLiveConfig(current, { enabled: false, updatedAt: 200 });

        expect(merged.ingestMode).toBe('move');
        expect(merged.enabled).toBe(false);
        expect(merged.updatedAt).toBe(200);
    });
});
