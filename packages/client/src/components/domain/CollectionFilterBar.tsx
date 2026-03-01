import { useMemo } from 'react';

import { Button } from '~/components/ui/Button';
import { Select, type SelectOption } from '~/components/ui/Select';
import { cn } from '~/components/ui/cn';
import {
    COLLECTION_SORT_OPTIONS,
    DEFAULT_COLLECTION_SORT,
    parseCollectionSort,
    type CollectionSort,
} from '~/features/collection/view-filter';

const MODEL_ALL_VALUE = '__collection_model_all__';

interface CollectionFilterBarProps {
    sort: CollectionSort;
    model: string;
    modelOptions: string[];
    loadingModelOptions?: boolean;
    modelOptionsError?: string | null;
    className?: string;
    embedded?: boolean;
    onSortChange: (sort: CollectionSort) => void;
    onModelChange: (value: string) => void;
    onReset: () => void;
}

export const CollectionFilterBar = ({
    sort,
    model,
    modelOptions,
    loadingModelOptions = false,
    modelOptionsError = null,
    className,
    embedded = false,
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
    const modelSelectOptions = useMemo<SelectOption[]>(
        () => [
            { value: MODEL_ALL_VALUE, label: 'All models' },
            ...resolvedModelOptions.map((option) => ({
                value: option,
                label: option,
            })),
        ],
        [resolvedModelOptions],
    );
    const sortSelectOptions = useMemo<SelectOption[]>(
        () =>
            COLLECTION_SORT_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
            })),
        [],
    );

    return (
        <div
            className={cn(
                'grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end',
                embedded
                    ? 'border-t border-brand-100 px-3 py-2.5'
                    : 'rounded-token-lg border border-line bg-surface-raised p-3',
                className,
            )}
        >
            <div>
                <label
                    id="collection-model-filter-label"
                    className="mb-1 block text-xs font-semibold text-ink-muted"
                >
                    Model
                </label>
                <Select
                    id="collection-model-filter"
                    ariaLabelledBy="collection-model-filter-label"
                    value={model || MODEL_ALL_VALUE}
                    options={modelSelectOptions}
                    onValueChange={(nextValue) => {
                        onModelChange(
                            nextValue === MODEL_ALL_VALUE ? '' : nextValue,
                        );
                    }}
                    disabled={loadingModelOptions && resolvedModelOptions.length === 0}
                />
                {modelOptionsError ? (
                    <p className="mt-1 text-xs font-medium text-warning-700">
                        Model options could not be loaded. You can still browse all models.
                    </p>
                ) : null}
            </div>

            <div>
                <label
                    id="collection-sort-filter-label"
                    className="mb-1 block text-xs font-semibold text-ink-muted"
                >
                    Sort
                </label>
                <Select
                    id="collection-sort-filter"
                    ariaLabelledBy="collection-sort-filter-label"
                    value={sort}
                    options={sortSelectOptions}
                    onValueChange={(nextValue) => {
                        onSortChange(parseCollectionSort(nextValue));
                    }}
                />
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
