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
import { cn } from './cn';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CalendarIcon,
    CrossIcon,
} from '~/icons';

// --- Types & Constants ---

interface DateTimePickerProps {
    id?: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    boundary?: 'start' | 'end';
    onChange: (value: string) => void;
}

const STORAGE_DATE_FORMAT = 'YYYY-MM-DDTHH:mm';
const DISPLAY_DATE_FORMAT = 'YYYY.MM.DD';
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const FIXED_WEEK_COUNT = 6;

const NAV_BUTTON_CLASS =
    'ui-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-token-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink';

// --- Helpers ---

const resolveBoundaryDate = (input: Date, boundary: 'start' | 'end') => {
    const resolved = dayjs(input);
    return boundary === 'end' ? resolved.endOf('day') : resolved.startOf('day');
};

interface CalendarDay {
    date: Date;
    day: number;
    outside: boolean;
}

const buildCalendarDays = (year: number, month: number): CalendarDay[] => {
    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay(); // 0=Sun
    const startDate = new Date(year, month, 1 - startDow);

    const totalCells = FIXED_WEEK_COUNT * 7;
    const days: CalendarDay[] = [];

    for (let i = 0; i < totalCells; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        days.push({
            date,
            day: date.getDate(),
            outside: date.getMonth() !== month,
        });
    }

    return days;
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

// --- Year/Month selector ---

interface YearMonthSelectorProps {
    month: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

const YearMonthSelector = ({
    month,
    onSelect,
    onClose,
}: YearMonthSelectorProps) => {
    const [viewYear, setViewYear] = useState(month.getFullYear());
    const currentMonth = month.getMonth();
    const currentYear = month.getFullYear();
    const today = new Date();

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    className={NAV_BUTTON_CLASS}
                    onClick={() => setViewYear((y) => y - 1)}
                    aria-label="Previous year"
                >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                </button>
                <span className="text-sm font-bold text-ink">
                    {viewYear}
                </span>
                <button
                    type="button"
                    className={NAV_BUTTON_CLASS}
                    onClick={() => setViewYear((y) => y + 1)}
                    aria-label="Next year"
                >
                    <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
                {MONTH_LABELS.map((label, index) => {
                    const isSelected =
                        viewYear === currentYear && index === currentMonth;
                    const isCurrentMonth =
                        viewYear === today.getFullYear() &&
                        index === today.getMonth();

                    return (
                        <button
                            key={label}
                            type="button"
                            className={cn(
                                'ui-focus-ring flex h-9 items-center justify-center rounded-token-sm text-xs font-semibold transition-colors',
                                isSelected
                                    ? 'bg-brand-500 text-ink-inverse'
                                    : isCurrentMonth
                                      ? 'bg-brand-50 font-bold text-brand-700 hover:bg-brand-100'
                                      : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                            )}
                            onClick={() => {
                                onSelect(new Date(viewYear, index, 1));
                                onClose();
                            }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// --- Calendar grid ---

interface CalendarGridProps {
    month: Date;
    selectedDate: Date | undefined;
    onMonthChange: (date: Date) => void;
    onSelect: (date: Date) => void;
    onYearMonthMode: () => void;
}

const CalendarGrid = ({
    month,
    selectedDate,
    onMonthChange,
    onSelect,
    onYearMonthMode,
}: CalendarGridProps) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const today = new Date();

    const days = useMemo(
        () => buildCalendarDays(year, monthIndex),
        [year, monthIndex],
    );

    const goToPrevMonth = () =>
        onMonthChange(new Date(year, monthIndex - 1, 1));
    const goToNextMonth = () =>
        onMonthChange(new Date(year, monthIndex + 1, 1));

    const monthLabel = dayjs(month).format('MMMM YYYY');

    return (
        <div>
            {/* Header: nav + month label */}
            <div className="flex h-10 items-center justify-between">
                <button
                    type="button"
                    className={NAV_BUTTON_CLASS}
                    onClick={goToPrevMonth}
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
                    onClick={goToNextMonth}
                    aria-label="Next month"
                >
                    <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
            </div>

            {/* Weekday headers */}
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

            {/* Day cells */}
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

// --- Main component ---

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
        [onChange, boundary],
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
                        <CrossIcon
                            className="h-3.5 w-3.5"
                            aria-hidden
                        />
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
                    <YearMonthSelector
                        month={month}
                        onSelect={setMonth}
                        onClose={() => setYearMonthMode(false)}
                    />
                ) : (
                    <CalendarGrid
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
