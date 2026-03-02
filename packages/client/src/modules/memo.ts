type Key = string | Array<string | number>;
type MemoStorage = 'memory' | 'session';

interface UseMemoStateOptions {
    storage?: MemoStorage;
}

interface UseMemoProps<T> {
    key: Key;
    defaultValue: T;
}

const memoStore = new Map<string, unknown>();
const SESSION_STORAGE_PREFIX = 'client.memo.';

const toMemoKey = (key: Key) => (Array.isArray(key) ? key.join('.') : key);
const resolveStorage = (storage?: MemoStorage): MemoStorage => storage ?? 'memory';

const readSessionValue = <T>(memoKey: string): T | undefined => {
    if (typeof window === 'undefined') {
        return undefined;
    }

    const rawValue = window.sessionStorage.getItem(
        `${SESSION_STORAGE_PREFIX}${memoKey}`,
    );
    if (!rawValue) {
        return undefined;
    }

    try {
        return JSON.parse(rawValue) as T;
    } catch {
        return undefined;
    }
};

const writeSessionValue = (memoKey: string, value: unknown) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(
            `${SESSION_STORAGE_PREFIX}${memoKey}`,
            JSON.stringify(value),
        );
    } catch {
        // Ignore serialization/storage errors and keep in-memory state.
    }
};

const readMemoValue = <T>(
    memoKey: string,
    defaultValue: T,
    storage?: MemoStorage,
): T => {
    const inMemoryValue = memoStore.get(memoKey) as T | undefined;
    if (inMemoryValue !== undefined) {
        return inMemoryValue;
    }

    if (resolveStorage(storage) === 'session') {
        const sessionValue = readSessionValue<T>(memoKey);
        if (sessionValue !== undefined) {
            memoStore.set(memoKey, sessionValue);
            return sessionValue;
        }
    }

    return defaultValue;
};

class MemoProxy<T> {
    private readonly key: string;
    private internalValue: T;

    constructor(key: Key, defaultValue: T) {
        this.key = toMemoKey(key);
        this.internalValue = readMemoValue(this.key, defaultValue, 'memory');
    }

    get value() {
        return this.internalValue;
    }

    set value(value: T) {
        memoStore.set(this.key, value);
        this.internalValue = value;
    }
}

export function useMemo<T>({ key, defaultValue }: UseMemoProps<T>) {
    return new MemoProxy(key, defaultValue);
}

export function useMemoState<T>(
    key: Key,
    defaultValue: T,
    options?: UseMemoStateOptions,
): [T, (value: T) => void] {
    const memoKey = toMemoKey(key);
    const storage = resolveStorage(options?.storage);
    const initialValue = readMemoValue<T>(memoKey, defaultValue, storage);

    return [
        initialValue,
        (value: T) => {
            memoStore.set(memoKey, value);
            if (storage === 'session') {
                writeSessionValue(memoKey, value);
            }
        },
    ];
}

export const clearMemoStore = () => {
    memoStore.clear();
};
