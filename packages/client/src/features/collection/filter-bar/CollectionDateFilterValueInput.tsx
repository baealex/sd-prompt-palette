import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { Button } from '~/components/ui/Button';
import { DateTimePicker } from '~/components/ui/DateTimePicker';
import { ArrowLeftIcon, ArrowRightIcon } from '~/icons';

import {
    formatStorageDateTime,
    parseDateValue,
    type DateFilterMode,
} from './date-utils';

interface CollectionDateFilterValueInputProps {
    dateFilterMode: DateFilterMode;
    dateFrom: string;
    dateTo: string;
    singleDayValue: string;
    singleDay: Dayjs | null;
    onDateRangeChange: (dateFrom: string, dateTo: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
}

export const CollectionDateFilterValueInput = ({
    dateFilterMode,
    dateFrom,
    dateTo,
    singleDayValue,
    singleDay,
    onDateRangeChange,
    onDateFromChange,
    onDateToChange,
}: CollectionDateFilterValueInputProps) => {
    if (dateFilterMode === 'single') {
        return (
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
                            formatStorageDateTime(previousDay.startOf('day')),
                            formatStorageDateTime(previousDay.endOf('day')),
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
                            formatStorageDateTime(parsedDate.startOf('day')),
                            formatStorageDateTime(parsedDate.endOf('day')),
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
        );
    }

    return (
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
                    onChange={onDateFromChange}
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
                    onChange={onDateToChange}
                />
            </div>
        </div>
    );
};
