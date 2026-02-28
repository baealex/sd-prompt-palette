import { useMemo } from 'react';

import { Button } from '~/components/ui/Button';
import { cn } from '~/components/ui/cn';
import {
    COLLECTION_SORT_OPTIONS,
    DEFAULT_COLLECTION_SORT,
    parseCollectionSort,
    type CollectionSort,
} from '~/features/collection/view-filter';

interface CollectionFilterBarProps {
    sort: CollectionSort;
    model: string;
    modelOptions: string[];
    loadingModelOptions?: boolean;
    className?: string;
    onSortChange: (sort: CollectionSort) => void;
    onModelChange: (value: string) => void;
    onReset: () => void;
}

export const CollectionFilterBar = ({
    sort,
    model,
    modelOptions,
    loadingModelOptions = false,
    className,
    onSortChange,
    onModelChange,
    onReset,
}: CollectionFilterBarProps) => {
    const canReset = model.length > 0 || sort !== DEFAULT_COLLECTION_SORT;
    const resolvedModelOptions = useMemo(() => {
        const normalized = modelOptions
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

        if (model && !normalized.includes(model)) {
            return [model, ...normalized];
        }

        return normalized;
    }, [model, modelOptions]);

    return (
        <div
            className={cn(
                'grid gap-3 rounded-token-lg border border-line bg-surface-base p-3 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end',
                className,
            )}
        >
            <div>
                <label
                    htmlFor="collection-model-filter"
                    className="mb-1 block text-xs font-semibold text-ink-muted"
                >
                    Model
                </label>
                <select
                    id="collection-model-filter"
                    value={model}
                    onChange={(event) => {
                        onModelChange(event.target.value);
                    }}
                    className="ui-focus-ring h-11 w-full rounded-token-md border border-line-strong bg-surface-base px-3 text-sm text-ink"
                    disabled={loadingModelOptions && resolvedModelOptions.length === 0}
                >
                    <option value="">All models</option>
                    {resolvedModelOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label
                    htmlFor="collection-sort-filter"
                    className="mb-1 block text-xs font-semibold text-ink-muted"
                >
                    Sort
                </label>
                <select
                    id="collection-sort-filter"
                    value={sort}
                    onChange={(event) => {
                        onSortChange(parseCollectionSort(event.target.value));
                    }}
                    className="ui-focus-ring h-11 w-full rounded-token-md border border-line-strong bg-surface-base px-3 text-sm text-ink"
                >
                    {COLLECTION_SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={!canReset}
                onClick={onReset}
            >
                Reset
            </Button>
        </div>
    );
};
