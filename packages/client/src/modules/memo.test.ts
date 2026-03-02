import { beforeEach, describe, expect, it } from 'vitest';

import { clearMemoStore, useMemoState } from './memo';

describe('memo', () => {
    beforeEach(() => {
        clearMemoStore();
        window.sessionStorage.clear();
    });

    it('persists session-backed values across store resets', () => {
        const key = ['memo', 'session', 'value'];
        const [, setValue] = useMemoState<number>(key, 0, {
            storage: 'session',
        });
        setValue(42);

        clearMemoStore();

        const [nextValue] = useMemoState<number>(key, 0, {
            storage: 'session',
        });
        expect(nextValue).toBe(42);
    });

    it('keeps memory-backed values out of session storage', () => {
        const key = ['memo', 'memory', 'value'];
        const [, setValue] = useMemoState<number>(key, 1);
        setValue(9);

        const raw = window.sessionStorage.getItem('client.memo.memo.memory.value');
        expect(raw).toBeNull();
    });
});
