import { useId, useMemo } from 'react';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { cn } from '~/components/ui/cn';
import { CrossIcon, SearchIcon } from '~/icons';

interface CollectionSearchBarProps {
    value: string;
    placeholder?: string;
    className?: string;
    embedded?: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

export const CollectionSearchBar = ({
    value,
    placeholder = 'Search',
    className,
    embedded = false,
    onChange,
    onSubmit,
}: CollectionSearchBarProps) => {
    const hasQuery = useMemo(() => value.trim().length > 0, [value]);
    const inputId = useId();

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
            className={cn('w-full', className)}
        >
            <label htmlFor={inputId} className="sr-only">
                Collection search
            </label>
            <div
                className={cn(
                    'relative p-1.5',
                    !embedded &&
                        'rounded-token-lg border-2 border-brand-200 bg-surface-raised shadow-surface',
                )}
            >
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
                <Input
                    id={inputId}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-11 border-0 bg-transparent pl-9 pr-28 text-sm shadow-none focus-visible:ring-0"
                />
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {hasQuery ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="px-2"
                            aria-label="Clear search query"
                            onClick={() => onChange('')}
                        >
                            <CrossIcon width={14} height={14} />
                        </Button>
                    ) : null}
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="px-3"
                        aria-label="Run collection search"
                    >
                        Search
                    </Button>
                </div>
            </div>
        </form>
    );
};
