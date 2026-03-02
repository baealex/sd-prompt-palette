import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import type { CollectionDateField } from '~/api';
import { Button } from '~/components/ui/Button';
import { Select, type SelectOption } from '~/components/ui/Select';
import { cn } from '~/components/ui/cn';
import { ChevronDownIcon } from '~/icons';
import type { CollectionDateQuickPreset } from '~/features/collection/view-filter';
import { parseCollectionDateField } from '~/features/collection/view-filter';

import { CollectionDateFilterValueInput } from './CollectionDateFilterValueInput';
import {
    formatStorageDateTime,
    resolveDateFilterMode,
    resolveSingleDay,
    type DateFilterMode,
    isSameCalendarDay,
} from './date-utils';

interface QuickPresetOption {
    value: CollectionDateQuickPreset;
    label: string;
}

interface CollectionDateFiltersSectionProps {
    embedded?: boolean;
    dateField: CollectionDateField;
    dateFrom: string;
    dateTo: string;
    dateSummary: string;
    hasActiveDateFilter: boolean;
    dateFieldSelectOptions: SelectOption[];
    quickPresetOptions: QuickPresetOption[];
    onDateFieldChange: (value: CollectionDateField) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onDateRangeChange: (dateFrom: string, dateTo: string) => void;
    onDateQuickPreset: (preset: CollectionDateQuickPreset) => void;
}

export const CollectionDateFiltersSection = ({
    embedded = false,
    dateField,
    dateFrom,
    dateTo,
    dateSummary,
    hasActiveDateFilter,
    dateFieldSelectOptions,
    quickPresetOptions,
    onDateFieldChange,
    onDateFromChange,
    onDateToChange,
    onDateRangeChange,
    onDateQuickPreset,
}: CollectionDateFiltersSectionProps) => {
    const [dateFiltersExpanded, setDateFiltersExpanded] =
        useState(hasActiveDateFilter);
    const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>(() =>
        resolveDateFilterMode(dateFrom, dateTo),
    );

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

    const singleDay = useMemo(
        () => resolveSingleDay(dateFrom, dateTo),
        [dateFrom, dateTo],
    );
    const singleDayValue = useMemo(() => {
        if (!singleDay) {
            return '';
        }

        return formatStorageDateTime(singleDay.startOf('day'));
    }, [singleDay]);

    return (
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
                                    if (
                                        dateFrom &&
                                        dateTo &&
                                        isSameCalendarDay(dateFrom, dateTo)
                                    ) {
                                        onDateToChange('');
                                    }
                                }}
                            >
                                Range
                            </button>
                        </div>
                    </div>

                    <CollectionDateFilterValueInput
                        dateFilterMode={dateFilterMode}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        singleDay={singleDay}
                        singleDayValue={singleDayValue}
                        onDateRangeChange={onDateRangeChange}
                        onDateFromChange={onDateFromChange}
                        onDateToChange={onDateToChange}
                    />

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
    );
};
