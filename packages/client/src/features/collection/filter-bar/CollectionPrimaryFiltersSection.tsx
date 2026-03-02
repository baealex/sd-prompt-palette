import { Button } from '~/components/ui/Button';
import { Select, type SelectOption } from '~/components/ui/Select';
import type { CollectionSort } from '~/features/collection/view-filter';

interface CollectionPrimaryFiltersSectionProps {
    model: string;
    sort: CollectionSort;
    canReset: boolean;
    loadingModelOptions: boolean;
    modelOptionsError: string | null;
    resolvedModelOptions: string[];
    modelSelectOptions: SelectOption[];
    sortSelectOptions: SelectOption[];
    modelAllValue: string;
    onModelChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onReset: () => void;
}

export const CollectionPrimaryFiltersSection = ({
    model,
    sort,
    canReset,
    loadingModelOptions,
    modelOptionsError,
    resolvedModelOptions,
    modelSelectOptions,
    sortSelectOptions,
    modelAllValue,
    onModelChange,
    onSortChange,
    onReset,
}: CollectionPrimaryFiltersSectionProps) => {
    return (
        <section
            aria-labelledby="collection-primary-filter-group-label"
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end"
        >
            <h3 id="collection-primary-filter-group-label" className="sr-only">
                Primary filters
            </h3>
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
                    value={model || modelAllValue}
                    options={modelSelectOptions}
                    onValueChange={(nextValue) => {
                        onModelChange(nextValue === modelAllValue ? '' : nextValue);
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
                    onValueChange={onSortChange}
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
        </section>
    );
};
