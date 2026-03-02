import dayjs from 'dayjs';
import { useMemo } from 'react';

import { cn } from '~/components/ui/cn';
import { ArrowLeftIcon, ArrowRightIcon } from '~/icons';

import { buildCalendarDays, isSameDay } from './calendar-utils';
import { NAV_BUTTON_CLASS, WEEKDAY_LABELS } from './constants';

interface DateTimePickerCalendarGridProps {
    month: Date;
    selectedDate: Date | undefined;
    onMonthChange: (date: Date) => void;
    onSelect: (date: Date) => void;
    onYearMonthMode: () => void;
}

export const DateTimePickerCalendarGrid = ({
    month,
    selectedDate,
    onMonthChange,
    onSelect,
    onYearMonthMode,
}: DateTimePickerCalendarGridProps) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const today = new Date();
    const days = useMemo(
        () => buildCalendarDays(year, monthIndex),
        [year, monthIndex],
    );
    const monthLabel = dayjs(month).format('MMMM YYYY');

    return (
        <div>
            <div className="flex h-10 items-center justify-between">
                <button
                    type="button"
                    className={NAV_BUTTON_CLASS}
                    onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
                    aria-label="Previous month"
                >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                </button>
                <button
                    type="button"
                    className="ui-focus-ring rounded-token-sm px-2.5 py-1 text-sm font-bold text-ink transition-colors hover:bg-surface-muted hover:text-brand-600"
                    onClick={onYearMonthMode}
                    aria-label="Select year and month"
                >
                    {monthLabel}
                </button>
                <button
                    type="button"
                    className={NAV_BUTTON_CLASS}
                    onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
                    aria-label="Next month"
                >
                    <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
            </div>

            <div className="mt-1 grid grid-cols-7">
                {WEEKDAY_LABELS.map((label) => (
                    <div
                        key={label}
                        className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-ink-subtle"
                    >
                        {label}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7" role="grid" aria-label="Calendar">
                {days.map((cell, index) => {
                    const isToday = isSameDay(cell.date, today);
                    const isSelected =
                        selectedDate !== undefined &&
                        isSameDay(cell.date, selectedDate);

                    return (
                        <div
                            key={index}
                            className="flex items-center justify-center p-0.5"
                            role="gridcell"
                        >
                            <button
                                type="button"
                                tabIndex={cell.outside ? -1 : 0}
                                aria-selected={isSelected}
                                className={cn(
                                    'ui-focus-ring h-10 w-10 rounded-full text-sm font-medium transition-colors',
                                    isSelected
                                        ? 'bg-brand-500 text-ink-inverse hover:bg-brand-600'
                                        : isToday
                                          ? 'font-bold text-brand-700 hover:bg-brand-50'
                                          : cell.outside
                                            ? 'text-ink-subtle/40 hover:bg-surface-muted hover:text-ink-subtle'
                                            : 'text-ink-muted hover:bg-brand-50 hover:text-brand-700',
                                )}
                                onClick={() => onSelect(cell.date)}
                            >
                                {cell.day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
