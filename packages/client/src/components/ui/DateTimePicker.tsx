import dayjs from 'dayjs';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useState,
} from 'react';
import type { MouseEvent } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './Popover';
import { DateTimePickerCalendarGrid } from './date-time-picker/calendar-grid';
import { resolveBoundaryDate } from './date-time-picker/calendar-utils';
import {
    DISPLAY_DATE_FORMAT,
    STORAGE_DATE_FORMAT,
} from './date-time-picker/constants';
import { DateTimePickerYearMonthSelector } from './date-time-picker/year-month-selector';
import { cn } from './cn';
import { CalendarIcon, CrossIcon } from '~/icons';

interface DateTimePickerProps {
    id?: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    boundary?: 'start' | 'end';
    onChange: (value: string) => void;
}

export const DateTimePicker = ({
    id,
    value,
    placeholder = 'Select date',
    disabled = false,
    boundary = 'start',
    onChange,
}: DateTimePickerProps) => {
    const [open, setOpen] = useState(false);
    const [yearMonthMode, setYearMonthMode] = useState(false);
    const panelId = useId();
    const selectedDate = useMemo(() => {
        if (!value) {
            return undefined;
        }
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed.toDate() : undefined;
    }, [value]);
    const [month, setMonth] = useState<Date>(selectedDate ?? new Date());

    useEffect(() => {
        if (!open) {
            setYearMonthMode(false);
            return;
        }
        setMonth(selectedDate ?? new Date());
    }, [open, selectedDate]);

    const displayValue = useMemo(() => {
        if (!selectedDate) {
            return '';
        }
        return dayjs(selectedDate).format(DISPLAY_DATE_FORMAT);
    }, [selectedDate]);

    const handleClear = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            onChange('');
            setOpen(false);
        },
        [onChange],
    );

    const handleSelect = useCallback(
        (date: Date) => {
            onChange(
                resolveBoundaryDate(date, boundary).format(STORAGE_DATE_FORMAT),
            );
            setOpen(false);
        },
        [boundary, onChange],
    );

    const handleGoToToday = useCallback(() => {
        setMonth(new Date());
        setYearMonthMode(false);
    }, []);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <div className="relative w-full">
                <PopoverTrigger asChild>
                    <button
                        id={id}
                        type="button"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-controls={panelId}
                        className={cn(
                            'ui-focus-ring flex h-9 w-full items-center gap-2 rounded-token-md border border-line-strong bg-surface-base px-2.5 pr-9 text-left text-sm transition-colors',
                            displayValue ? 'text-ink' : 'text-ink-subtle',
                            disabled
                                ? 'cursor-not-allowed opacity-55'
                                : 'hover:border-brand-300',
                        )}
                    >
                        <CalendarIcon
                            className={cn(
                                'h-4 w-4 shrink-0',
                                displayValue
                                    ? 'text-brand-500'
                                    : 'text-ink-subtle',
                            )}
                            aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">
                            {displayValue || placeholder}
                        </span>
                    </button>
                </PopoverTrigger>
                {value && !disabled ? (
                    <button
                        type="button"
                        aria-label="Clear date"
                        className="ui-focus-ring absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
                        onClick={handleClear}
                    >
                        <CrossIcon className="h-3.5 w-3.5" aria-hidden />
                    </button>
                ) : null}
            </div>

            <PopoverContent
                id={panelId}
                role="dialog"
                aria-modal="false"
                align="start"
                sideOffset={8}
                collisionPadding={8}
                className="z-50 w-[320px] rounded-token-lg border border-line bg-surface-raised p-3 shadow-overlay"
            >
                {yearMonthMode ? (
                    <DateTimePickerYearMonthSelector
                        month={month}
                        onSelect={setMonth}
                        onClose={() => setYearMonthMode(false)}
                    />
                ) : (
                    <DateTimePickerCalendarGrid
                        month={month}
                        selectedDate={selectedDate}
                        onMonthChange={setMonth}
                        onSelect={handleSelect}
                        onYearMonthMode={() => setYearMonthMode(true)}
                    />
                )}

                <div className="mt-2 flex items-center justify-between border-t border-line/50 pt-2">
                    <button
                        type="button"
                        className="ui-focus-ring rounded-token-sm px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                        onClick={handleGoToToday}
                    >
                        Today
                    </button>
                    {selectedDate ? (
                        <span className="text-[11px] font-medium text-ink-subtle">
                            {dayjs(selectedDate).format('YYYY.MM.DD')}
                        </span>
                    ) : null}
                </div>
            </PopoverContent>
        </Popover>
    );
};
