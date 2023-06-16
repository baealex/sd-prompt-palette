const memo = new Map();

type Key = string | (string | number)[];

interface UseMemoProps<T> {
    key: Key;
    defaultValue: T;
}

class Proxy<T> {
    private _value: T;
    private _key: Key;

    constructor(key: Key, defaultValue: T) {
        this._key = key;
        this._value = memo.get(key) ?? defaultValue;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        memo.set(this._key, value);
        this._value = value;
    }
}

export function useMemo<T>({ key, defaultValue }: UseMemoProps<T>) {
    if (Array.isArray(key)) {
        key = key.join('.');
    }

    return new Proxy(key, defaultValue);
}

export function useMemoState<T>(key: Key, defaultValue: T): [T, (value: T) => void] {
    if (Array.isArray(key)) {
        key = key.join('.');
    }

    return [
        memo.get(key) ?? defaultValue,
        (value: T) => {
            memo.set(key, value);
        }
    ];
}