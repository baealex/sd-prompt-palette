import { useId, useMemo } from 'react';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Select } from '~/components/ui/Select';
import { cn } from '~/components/ui/cn';
import type { CollectionSearchBy } from '~/api';
import { parseCollectionSearchBy } from '~/features/collection/view-filter';
import { CrossIcon, SearchIcon } from '~/icons';

interface CollectionSearchBarProps {
    value: string;
    searchBy: CollectionSearchBy;
    placeholder?: string;
    className?: string;
    embedded?: boolean;
    onChange: (value: string) => void;
    onSearchByChange: (nextSearchBy: CollectionSearchBy) => void;
    onSubmit: () => void;
}

export const CollectionSearchBar = ({
    value,
    searchBy,
    placeholder = 'Search',
    className,
    embedded = false,
    onChange,
    onSearchByChange,
    onSubmit,
}: CollectionSearchBarProps) => {
    const hasQuery = useMemo(() => value.trim().length > 0, [value]);
    const inputId = useId();
    const searchById = useId();

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
            <label htmlFor={searchById} className="sr-only">
                Search field
            </label>
            <div
                className={cn(
                    'grid gap-2 p-1.5',
                    !embedded &&
                        'rounded-token-lg border-2 border-brand-200 bg-surface-raised shadow-surface',
                )}
            >
                <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center">
                    <Select
                        id={searchById}
                        value={searchBy}
                        options={[
                            { value: 'title', label: 'Search in Title' },
                            { value: 'prompt', label: 'Search in Prompt' },
                            {
                                value: 'negative_prompt',
                                label: 'Search in Negative Prompt',
                            },
                        ]}
                        onValueChange={(nextValue) =>
                            onSearchByChange(parseCollectionSearchBy(nextValue))
                        }
                    />
                    <div className="relative">
                        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
                        <Input
                            id={inputId}
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder={placeholder}
                            className="h-11 border-0 bg-transparent pl-9 pr-3 text-sm shadow-none focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-1">
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
            </div>
        </form>
    );
};
