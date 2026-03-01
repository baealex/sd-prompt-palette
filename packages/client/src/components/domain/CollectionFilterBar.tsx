import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Select, type SelectOption } from '~/components/ui/Select';
import { cn } from '~/components/ui/cn';
import { ChevronDownIcon } from '~/icons';
import type { CollectionDateField } from '~/api';
import {
    COLLECTION_DATE_FIELD_OPTIONS,
    COLLECTION_SORT_OPTIONS,
    DEFAULT_COLLECTION_DATE_FIELD,
    DEFAULT_COLLECTION_SORT,
    parseCollectionDateField,
    parseCollectionSort,
    type CollectionDateQuickPreset,
    type CollectionSort,
} from '~/features/collection/view-filter';

const MODEL_ALL_VALUE = '__collection_model_all__';

interface CollectionFilterBarProps {
    sort: CollectionSort;
    model: string;
    dateField: CollectionDateField;
    dateFrom: string;
    dateTo: string;
    modelOptions: string[];
    loadingModelOptions?: boolean;
    modelOptionsError?: string | null;
    className?: string;
    embedded?: boolean;
    onSortChange: (sort: CollectionSort) => void;
    onModelChange: (value: string) => void;
    onDateFieldChange: (value: CollectionDateField) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onDateQuickPreset: (preset: CollectionDateQuickPreset) => void;
    onReset: () => void;
}

export const CollectionFilterBar = ({
    sort,
    model,
    dateField,
    dateFrom,
    dateTo,
    modelOptions,
    loadingModelOptions = false,
    modelOptionsError = null,
    className,
    embedded = false,
    onSortChange,
    onModelChange,
    onDateFieldChange,
    onDateFromChange,
    onDateToChange,
    onDateQuickPreset,
    onReset,
}: CollectionFilterBarProps) => {
    const hasDateRange = dateFrom.length > 0 || dateTo.length > 0;
    const hasActiveDateFilter =
        hasDateRange || dateField !== DEFAULT_COLLECTION_DATE_FIELD;
    const [dateFiltersExpanded, setDateFiltersExpanded] =
        useState(hasActiveDateFilter);
    const canReset =
        model.length > 0 ||
        sort !== DEFAULT_COLLECTION_SORT ||
        hasDateRange ||
        dateField !== DEFAULT_COLLECTION_DATE_FIELD;
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
    const dateFieldSelectOptions = useMemo<SelectOption[]>(
        () =>
            COLLECTION_DATE_FIELD_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
            })),
        [],
    );
    const quickPresetOptions = useMemo<
        { value: CollectionDateQuickPreset; label: string }[]
    >(
        () => [
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'week', label: '1 Week' },
            { value: 'month', label: '1 Month' },
            { value: 'all', label: 'All' },
        ],
        [],
    );

    useEffect(() => {
        if (hasActiveDateFilter) {
            setDateFiltersExpanded(true);
        }
    }, [hasActiveDateFilter]);

    return (
        <div
            className={cn(
                'grid gap-3',
                embedded
                    ? 'border-t border-brand-100 px-3 py-2.5'
                    : 'rounded-token-lg border border-line bg-surface-raised p-3',
                className,
            )}
        >
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
                        value={model || MODEL_ALL_VALUE}
                        options={modelSelectOptions}
                        onValueChange={(nextValue) => {
                            onModelChange(
                                nextValue === MODEL_ALL_VALUE ? ''
                                    : nextValue,
                            );
                        }}
                        disabled={
                            loadingModelOptions &&
                            resolvedModelOptions.length === 0
                        }
                    />
                    {modelOptionsError ? (
                        <p className="mt-1 text-xs font-medium text-warning-700">
                            Model options could not be loaded. You can still
                            browse all models.
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
            </section>

            <section
                aria-labelledby="collection-date-filter-group-label"
                className={cn(
                    'rounded-token-md border border-line/70 p-2.5',
                    embedded ? 'bg-brand-50/30' : 'bg-surface',
                )}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-expanded={dateFiltersExpanded}
                    aria-controls="collection-date-filter-panel"
                    onClick={() => {
                        setDateFiltersExpanded((previous) => !previous);
                    }}
                    className="!h-auto w-full justify-between rounded-token-sm border border-transparent px-2 py-2 hover:border-line"
                >
                    <span className="flex min-w-0 flex-col items-start text-left">
                        <span
                            id="collection-date-filter-group-label"
                            className="text-sm font-semibold text-ink"
                        >
                            Date filters
                        </span>
                        <span className="text-[11px] font-medium text-ink-muted">
                            Filter by collection added or image generated date.
                        </span>
                    </span>
                    <span className="ml-2 inline-flex items-center gap-2">
                        {hasActiveDateFilter ? (
                            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                                Active
                            </span>
                        ) : null}
                        <ChevronDownIcon
                            aria-hidden
                            className={cn(
                                'h-4 w-4 text-ink-muted transition-transform',
                                dateFiltersExpanded ? 'rotate-180' : '',
                            )}
                        />
                    </span>
                </Button>

                {dateFiltersExpanded ? (
                    <div
                        id="collection-date-filter-panel"
                        className="mt-2 border-t border-line/70 pt-2"
                    >
                        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
                            <div>
                                <label
                                    id="collection-date-field-filter-label"
                                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                                >
                                    Date type
                                </label>
                                <Select
                                    id="collection-date-field-filter"
                                    ariaLabelledBy="collection-date-field-filter-label"
                                    value={dateField}
                                    options={dateFieldSelectOptions}
                                    onValueChange={(nextValue) => {
                                        onDateFieldChange(
                                            parseCollectionDateField(nextValue),
                                        );
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="collection-date-from-filter"
                                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                                >
                                    From
                                </label>
                                <Input
                                    id="collection-date-from-filter"
                                    type="datetime-local"
                                    value={dateFrom}
                                    onChange={(event) => {
                                        onDateFromChange(event.target.value);
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="collection-date-to-filter"
                                    className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                                >
                                    To
                                </label>
                                <Input
                                    id="collection-date-to-filter"
                                    type="datetime-local"
                                    value={dateTo}
                                    onChange={(event) => {
                                        onDateToChange(event.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-2">
                            <p className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                                Quick range
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {quickPresetOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onDateQuickPreset(option.value);
                                        }}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
};
