import { useState } from 'react';

import { cn } from '~/components/ui/cn';
import { ArrowLeftIcon, ArrowRightIcon } from '~/icons';

import { MONTH_LABELS, NAV_BUTTON_CLASS } from './constants';

interface DateTimePickerYearMonthSelectorProps {
    month: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

export const DateTimePickerYearMonthSelector = ({
    month,
    onSelect,
    onClose,
}: DateTimePickerYearMonthSelectorProps) => {
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
                    onClick={() => setViewYear((year) => year - 1)}
                    aria-label="Previous year"
                >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                </button>
                <span className="text-sm font-bold text-ink">{viewYear}</span>
                <button
                    type="button"
                    className={NAV_BUTTON_CLASS}
                    onClick={() => setViewYear((year) => year + 1)}
                    aria-label="Next year"
                >
                    <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
                {MONTH_LABELS.map((label, monthIndex) => {
                    const isSelected =
                        viewYear === currentYear &&
                        monthIndex === currentMonth;
                    const isCurrentMonth =
                        viewYear === today.getFullYear() &&
                        monthIndex === today.getMonth();

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
                                onSelect(new Date(viewYear, monthIndex, 1));
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
