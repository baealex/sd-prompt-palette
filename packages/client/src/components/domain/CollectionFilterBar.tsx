import dayjs from 'dayjs';
import { useMemo } from 'react';

import { cn } from '~/components/ui/cn';
import { CollectionDateFiltersSection } from '~/features/collection/filter-bar/CollectionDateFiltersSection';
import { CollectionPrimaryFiltersSection } from '~/features/collection/filter-bar/CollectionPrimaryFiltersSection';
import { isSameCalendarDay } from '~/features/collection/filter-bar/date-utils';
import type { CollectionDateField } from '~/api';
import {
    COLLECTION_DATE_FIELD_OPTIONS,
    COLLECTION_SORT_OPTIONS,
    DEFAULT_COLLECTION_DATE_FIELD,
    DEFAULT_COLLECTION_SORT,
    parseCollectionSort,
    type CollectionDateQuickPreset,
    type CollectionSort,
} from '~/features/collection/view-filter';
import type { SelectOption } from '~/components/ui/Select';

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
    onDateRangeChange: (dateFrom: string, dateTo: string) => void;
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
    onDateRangeChange,
    onDateQuickPreset,
    onReset,
}: CollectionFilterBarProps) => {
    const hasDateRange = dateFrom.length > 0 || dateTo.length > 0;
    const hasActiveDateFilter =
        hasDateRange || dateField !== DEFAULT_COLLECTION_DATE_FIELD;
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

    const dateFieldLabelMap = useMemo(() => {
        return new Map(
            COLLECTION_DATE_FIELD_OPTIONS.map((option) => [
                option.value,
                option.label,
            ]),
        );
    }, []);

    const dateSummary = useMemo(() => {
        if (!hasActiveDateFilter) {
            return 'Filter by collection added or image generated date.';
        }

        const activeFieldLabel =
            dateFieldLabelMap.get(dateField) ??
            COLLECTION_DATE_FIELD_OPTIONS[0].label;
        const formatSummaryDate = (value: string) => {
            const parsed = dayjs(value);
            if (!parsed.isValid()) {
                return value;
            }
            return parsed.format('YY.MM.DD');
        };

        if (dateFrom && dateTo && isSameCalendarDay(dateFrom, dateTo)) {
            return `${activeFieldLabel}: ${formatSummaryDate(dateFrom)}`;
        }
        if (dateFrom && dateTo) {
            return `${activeFieldLabel}: ${formatSummaryDate(dateFrom)} - ${formatSummaryDate(dateTo)}`;
        }
        if (dateFrom) {
            return `${activeFieldLabel}: from ${formatSummaryDate(dateFrom)}`;
        }
        if (dateTo) {
            return `${activeFieldLabel}: until ${formatSummaryDate(dateTo)}`;
        }

        return `${activeFieldLabel}: all dates`;
    }, [dateField, dateFieldLabelMap, dateFrom, dateTo, hasActiveDateFilter]);

    return (
        <div
            className={cn(
                'grid gap-4',
                embedded
                    ? 'border-t border-brand-100 px-3 py-3'
                    : 'rounded-token-lg border border-line bg-surface-raised p-4',
                className,
            )}
        >
            <CollectionPrimaryFiltersSection
                model={model}
                sort={sort}
                canReset={canReset}
                loadingModelOptions={loadingModelOptions}
                modelOptionsError={modelOptionsError}
                resolvedModelOptions={resolvedModelOptions}
                modelSelectOptions={modelSelectOptions}
                sortSelectOptions={sortSelectOptions}
                modelAllValue={MODEL_ALL_VALUE}
                onModelChange={onModelChange}
                onSortChange={(nextValue) => {
                    onSortChange(parseCollectionSort(nextValue));
                }}
                onReset={onReset}
            />

            <CollectionDateFiltersSection
                embedded={embedded}
                dateField={dateField}
                dateFrom={dateFrom}
                dateTo={dateTo}
                dateSummary={dateSummary}
                hasActiveDateFilter={hasActiveDateFilter}
                dateFieldSelectOptions={dateFieldSelectOptions}
                quickPresetOptions={quickPresetOptions}
                onDateFieldChange={onDateFieldChange}
                onDateFromChange={onDateFromChange}
                onDateToChange={onDateToChange}
                onDateRangeChange={onDateRangeChange}
                onDateQuickPreset={onDateQuickPreset}
            />
        </div>
    );
};
