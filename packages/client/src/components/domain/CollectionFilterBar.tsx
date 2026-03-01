import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '~/components/ui/Button';
import { DateTimePicker } from '~/components/ui/DateTimePicker';
import { Select, type SelectOption } from '~/components/ui/Select';
import { cn } from '~/components/ui/cn';
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from '~/icons';
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
const STORAGE_DATE_FORMAT = 'YYYY-MM-DDTHH:mm';

type DateFilterMode = 'single' | 'range';

const parseDateValue = (value: string) => {
    if (!value) {
        return null;
    }

    const parsed = dayjs(value);
    if (!parsed.isValid()) {
        return null;
    }

    return parsed;
};

const formatStorageDateTime = (value: dayjs.Dayjs) =>
    value.format(STORAGE_DATE_FORMAT);

const resolveSingleDay = (dateFrom: string, dateTo: string) => {
    const parsedFrom = parseDateValue(dateFrom);
    if (parsedFrom) {
        return parsedFrom;
    }

    const parsedTo = parseDateValue(dateTo);
    if (parsedTo) {
        return parsedTo;
    }

    return null;
};

const isSameCalendarDay = (dateFrom: string, dateTo: string) => {
    const parsedFrom = parseDateValue(dateFrom);
    const parsedTo = parseDateValue(dateTo);

    if (!parsedFrom || !parsedTo) {
        return false;
    }

    return parsedFrom.isSame(parsedTo, 'day');
};

const resolveDateFilterMode = (
    dateFrom: string,
    dateTo: string,
): DateFilterMode => {
    if (!dateFrom && !dateTo) {
        return 'single';
    }

    return isSameCalendarDay(dateFrom, dateTo) ? 'single' : 'range';
};

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
    const [dateFiltersExpanded, setDateFiltersExpanded] =
        useState(hasActiveDateFilter);
    const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>(() =>
        resolveDateFilterMode(dateFrom, dateTo),
    );
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
            COLLECTION_DATE_FIELD_OPTIONS.map((option) => [option.value, option.label]),
        );
    }, []);
    const dateSummary = useMemo(() => {
        if (!hasActiveDateFilter) {
            return 'Filter by collection added or image generated date.';
        }

        const activeFieldLabel =
            dateFieldLabelMap.get(dateField) ?? COLLECTION_DATE_FIELD_OPTIONS[0].label;
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

    useEffect(() => {
        if (hasActiveDateFilter) {
            setDateFiltersExpanded(true);
        }
    }, [hasActiveDateFilter]);
    useEffect(() => {
        if (!dateFrom && !dateTo) {
            return;
        }
        setDateFilterMode(resolveDateFilterMode(dateFrom, dateTo));
    }, [dateFrom, dateTo]);

    const singleDay = useMemo(() => resolveSingleDay(dateFrom, dateTo), [dateFrom, dateTo]);
    const singleDayValue = useMemo(() => {
        if (!singleDay) {
            return '';
        }

        return formatStorageDateTime(singleDay.startOf('day'));
    }, [singleDay]);

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
                    'rounded-token-md border border-line/70 bg-surface-base/80 p-3',
                    embedded ? 'shadow-surface' : '',
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
                    className="!h-auto w-full justify-between rounded-token-md border border-line/60 bg-surface-raised px-3.5 py-3 hover:border-line-strong hover:bg-surface-muted"
                >
                    <span className="flex min-w-0 flex-col items-start text-left">
                        <span
                            id="collection-date-filter-group-label"
                            className="text-sm font-semibold text-ink"
                        >
                            Date filters
                        </span>
                        <span className="mt-0.5 text-xs font-medium text-ink-subtle">
                            {dateSummary}
                        </span>
                    </span>
                    <span className="ml-2 inline-flex items-center gap-2">
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
                        className="mt-3 grid gap-3 border-t border-line/70 pt-3"
                    >
                        {/* Row 1: Date type + Day/Range toggle */}
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[200px] flex-1">
                                <label
                                    id="collection-date-field-filter-label"
                                    className="mb-1.5 block text-xs font-semibold text-ink-muted"
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
                            <div
                                role="radiogroup"
                                aria-label="Date filter mode"
                                className="inline-flex rounded-token-md border border-line/70 bg-surface-muted p-0.5"
                            >
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={dateFilterMode === 'single'}
                                    className={cn(
                                        'ui-focus-ring inline-flex h-9 min-w-[80px] items-center justify-center rounded-token-sm px-3 text-xs font-semibold transition-colors',
                                        dateFilterMode === 'single'
                                            ? 'border border-line-strong bg-surface-raised text-ink shadow-surface'
                                            : 'border border-transparent text-ink-muted hover:text-ink',
                                    )}
                                    onClick={() => {
                                        setDateFilterMode('single');
                                        const baseDay = singleDay?.startOf('day')
                                            ?? dayjs().startOf('day');
                                        onDateRangeChange(
                                            formatStorageDateTime(baseDay.startOf('day')),
                                            formatStorageDateTime(baseDay.endOf('day')),
                                        );
                                    }}
                                >
                                    Day
                                </button>
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={dateFilterMode === 'range'}
                                    className={cn(
                                        'ui-focus-ring inline-flex h-9 min-w-[80px] items-center justify-center rounded-token-sm px-3 text-xs font-semibold transition-colors',
                                        dateFilterMode === 'range'
                                            ? 'border border-line-strong bg-surface-raised text-ink shadow-surface'
                                            : 'border border-transparent text-ink-muted hover:text-ink',
                                    )}
                                    onClick={() => {
                                        setDateFilterMode('range');
                                        if (dateFrom && dateTo && isSameCalendarDay(dateFrom, dateTo)) {
                                            onDateToChange('');
                                        }
                                    }}
                                >
                                    Range
                                </button>
                            </div>
                        </div>

                        {/* Row 2: Date input — mode-dependent */}
                        {dateFilterMode === 'single' ? (
                            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="!h-9 !w-9 rounded-token-md border border-line/70 bg-surface-raised text-ink-muted hover:border-line-strong hover:bg-surface-muted"
                                    aria-label="Previous day"
                                    onClick={() => {
                                        const baseDay = singleDay?.startOf('day')
                                            ?? dayjs().startOf('day');
                                        const previousDay = baseDay.subtract(1, 'day');
                                        onDateRangeChange(
                                            formatStorageDateTime(
                                                previousDay.startOf('day'),
                                            ),
                                            formatStorageDateTime(
                                                previousDay.endOf('day'),
                                            ),
                                        );
                                    }}
                                >
                                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                                </Button>
                                <DateTimePicker
                                    id="collection-date-single-filter"
                                    value={singleDayValue}
                                    boundary="start"
                                    placeholder="Select day"
                                    onChange={(nextValue) => {
                                        if (!nextValue) {
                                            onDateRangeChange('', '');
                                            return;
                                        }

                                        const parsedDate = parseDateValue(nextValue);
                                        if (!parsedDate) {
                                            return;
                                        }

                                        onDateRangeChange(
                                            formatStorageDateTime(
                                                parsedDate.startOf('day'),
                                            ),
                                            formatStorageDateTime(
                                                parsedDate.endOf('day'),
                                            ),
                                        );
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="!h-9 !w-9 rounded-token-md border border-line/70 bg-surface-raised text-ink-muted hover:border-line-strong hover:bg-surface-muted"
                                    aria-label="Next day"
                                    onClick={() => {
                                        const baseDay = singleDay?.startOf('day')
                                            ?? dayjs().startOf('day');
                                        const nextDay = baseDay.add(1, 'day');
                                        onDateRangeChange(
                                            formatStorageDateTime(nextDay.startOf('day')),
                                            formatStorageDateTime(nextDay.endOf('day')),
                                        );
                                    }}
                                >
                                    <ArrowRightIcon className="h-4 w-4" aria-hidden />
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
                                <div>
                                    <label
                                        htmlFor="collection-date-from-filter"
                                        className="mb-1.5 block text-xs font-semibold text-ink-muted"
                                    >
                                        From
                                    </label>
                                    <DateTimePicker
                                        id="collection-date-from-filter"
                                        value={dateFrom}
                                        boundary="start"
                                        onChange={(nextValue) => {
                                            onDateFromChange(nextValue);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="collection-date-to-filter"
                                        className="mb-1.5 block text-xs font-semibold text-ink-muted"
                                    >
                                        To
                                    </label>
                                    <DateTimePicker
                                        id="collection-date-to-filter"
                                        value={dateTo}
                                        boundary="end"
                                        onChange={(nextValue) => {
                                            onDateToChange(nextValue);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Row 3: Quick presets — always visible */}
                        <div className="flex flex-wrap gap-1.5">
                            {quickPresetOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-token-md border border-line/70 bg-surface-raised px-3 text-xs font-medium text-ink-muted hover:border-line-strong hover:bg-surface-muted"
                                    onClick={() => {
                                        onDateQuickPreset(option.value);
                                    }}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
};
