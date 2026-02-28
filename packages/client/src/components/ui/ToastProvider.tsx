import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';

type ToastVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface ToastInput {
    message: string;
    variant?: ToastVariant;
    durationMs?: number;
}

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    pushToast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASS: Record<ToastVariant, string> = {
    info: 'border-info-200 bg-info-50 text-info-700',
    success: 'border-success-200 bg-success-50 text-success-700',
    warning: 'border-warning-200 bg-warning-50 text-warning-700',
    error: 'border-danger-200 bg-danger-50 text-danger-700',
    neutral: 'border-line bg-surface-muted text-ink-muted',
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timerRef = useRef<Map<number, number>>(new Map());
    const nextIdRef = useRef(1);

    const dismissToast = useCallback((id: number) => {
        const timerId = timerRef.current.get(id);
        if (timerId) {
            window.clearTimeout(timerId);
            timerRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback(
        (input: ToastInput) => {
            const id = nextIdRef.current++;
            const variant = input.variant ?? 'neutral';
            const durationMs =
                input.durationMs ?? (variant === 'error' ? 4200 : 2600);

            setToasts((prev) => [
                ...prev,
                {
                    id,
                    message: input.message,
                    variant,
                },
            ]);

            const timerId = window.setTimeout(() => {
                dismissToast(id);
            }, durationMs);
            timerRef.current.set(id, timerId);
        },
        [dismissToast],
    );

    const contextValue = useMemo(() => ({ pushToast }), [pushToast]);

    useEffect(() => {
        return () => {
            timerRef.current.forEach((timerId) => {
                window.clearTimeout(timerId);
            });
            timerRef.current.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role={toast.variant === 'error' ? 'alert' : 'status'}
                        className={`pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-token-md border p-3 text-sm shadow-overlay ${VARIANT_CLASS[toast.variant]}`}
                    >
                        <p className="leading-snug">{toast.message}</p>
                        <button
                            type="button"
                            className="ui-focus-ring ui-touch shrink-0 rounded-token-sm text-xs font-semibold transition-colors hover:bg-black/10"
                            onClick={() => dismissToast(toast.id)}
                            aria-label="Dismiss notification"
                        >
                            Close
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
