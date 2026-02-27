import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

export interface PathStoreState {
    collection: string;
}

interface PathStoreValue {
    paths: PathStoreState;
    setPath: (key: keyof PathStoreState, value: string) => void;
}

const DEFAULT_PATHS: PathStoreState = {
    collection: '/collection',
};

const PathStoreContext = createContext<PathStoreValue | null>(null);

export const PathStoreProvider = ({ children }: PropsWithChildren) => {
    const [paths, setPaths] = useState<PathStoreState>(DEFAULT_PATHS);

    const value = useMemo<PathStoreValue>(() => ({
        paths,
        setPath: (key, nextValue) => {
            setPaths((prev) => ({
                ...prev,
                [key]: nextValue,
            }));
        },
    }), [paths]);

    return (
        <PathStoreContext.Provider value={value}>
            {children}
        </PathStoreContext.Provider>
    );
};

export const usePathStore = () => {
    const context = useContext(PathStoreContext);
    if (!context) {
        throw new Error('usePathStore must be used within PathStoreProvider');
    }
    return context;
};
