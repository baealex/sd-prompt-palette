import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Key,
    type ReactNode,
} from 'react';

interface MasonryBreakpoint {
    minWidth: number;
    columns: number;
}

interface MasonryColumnsProps<T> {
    items: T[];
    getItemKey: (item: T, index: number) => Key;
    renderItem: (item: T, index: number) => ReactNode;
    breakpoints?: MasonryBreakpoint[];
    breakpointMode?: 'viewport' | 'container';
    className?: string;
    columnClassName?: string;
}

const DEFAULT_BREAKPOINTS: MasonryBreakpoint[] = [
    { minWidth: 1280, columns: 3 },
    { minWidth: 768, columns: 2 },
    { minWidth: 0, columns: 1 },
];

const normalizeBreakpoints = (input?: MasonryBreakpoint[]) => {
    const source = input && input.length > 0 ? input : DEFAULT_BREAKPOINTS;
    return [...source]
        .filter((item) => Number.isFinite(item.minWidth) && item.columns > 0)
        .sort((a, b) => b.minWidth - a.minWidth);
};

const resolveColumnCountByWidth = (
    breakpoints: MasonryBreakpoint[],
    width: number,
) => {
    if (!Number.isFinite(width) || width <= 0) {
        return 1;
    }

    for (const breakpoint of breakpoints) {
        if (width >= breakpoint.minWidth) {
            return Math.max(1, Math.trunc(breakpoint.columns));
        }
    }

    return 1;
};

export const MasonryColumns = <T,>({
    items,
    getItemKey,
    renderItem,
    breakpoints,
    breakpointMode = 'viewport',
    className = 'grid gap-4',
    columnClassName = 'space-y-4',
}: MasonryColumnsProps<T>) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const normalizedBreakpoints = useMemo(
        () => normalizeBreakpoints(breakpoints),
        [breakpoints],
    );
    const [columnCount, setColumnCount] = useState(1);

    useEffect(() => {
        if (breakpointMode === 'container') {
            const target = containerRef.current;
            if (!target) {
                return;
            }

            const updateByContainerWidth = () => {
                setColumnCount(
                    resolveColumnCountByWidth(
                        normalizedBreakpoints,
                        target.clientWidth,
                    ),
                );
            };

            updateByContainerWidth();

            if (typeof ResizeObserver !== 'undefined') {
                const observer = new ResizeObserver(() => {
                    updateByContainerWidth();
                });
                observer.observe(target);
                return () => {
                    observer.disconnect();
                };
            }

            window.addEventListener('resize', updateByContainerWidth);
            return () => {
                window.removeEventListener('resize', updateByContainerWidth);
            };
        }

        const updateByViewportWidth = () => {
            const viewportWidth =
                typeof window !== 'undefined' ? window.innerWidth : 0;
            setColumnCount(
                resolveColumnCountByWidth(normalizedBreakpoints, viewportWidth),
            );
        };

        updateByViewportWidth();
        window.addEventListener('resize', updateByViewportWidth);
        return () => {
            window.removeEventListener('resize', updateByViewportWidth);
        };
    }, [breakpointMode, normalizedBreakpoints]);

    const columns = useMemo(() => {
        const count = Math.max(1, columnCount);
        const grouped = Array.from(
            { length: count },
            () => [] as Array<{ item: T; index: number }>,
        );

        items.forEach((item, index) => {
            const targetColumnIndex = index % count;
            grouped[targetColumnIndex].push({ item, index });
        });

        return grouped;
    }, [columnCount, items]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
            {columns.map((columnItems, columnIndex) => (
                <div
                    key={`masonry-column-${columnIndex}`}
                    className={columnClassName}
                >
                    {columnItems.map(({ item, index }) => (
                        <div key={getItemKey(item, index)}>
                            {renderItem(item, index)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
