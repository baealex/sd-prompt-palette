const memoStore = new Map<string, unknown>();

type Key = string | Array<string | number>;

interface UseMemoProps<T> {
    key: Key;
    defaultValue: T;
}

const toMemoKey = (key: Key) => (Array.isArray(key) ? key.join('.') : key);

class MemoProxy<T> {
    private readonly key: string;
    private internalValue: T;

    constructor(key: Key, defaultValue: T) {
        this.key = toMemoKey(key);
        this.internalValue = (memoStore.get(this.key) as T | undefined) ?? defaultValue;
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

export function useMemoState<T>(key: Key, defaultValue: T): [T, (value: T) => void] {
    const memoKey = toMemoKey(key);

    return [
        (memoStore.get(memoKey) as T | undefined) ?? defaultValue,
        (value: T) => {
            memoStore.set(memoKey, value);
        },
    ];
}
