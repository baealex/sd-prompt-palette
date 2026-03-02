import dayjs from 'dayjs';

import { FIXED_WEEK_COUNT } from './constants';

export interface CalendarDay {
    date: Date;
    day: number;
    outside: boolean;
}

export const resolveBoundaryDate = (input: Date, boundary: 'start' | 'end') => {
    const resolved = dayjs(input);
    return boundary === 'end' ? resolved.endOf('day') : resolved.startOf('day');
};

export const buildCalendarDays = (year: number, month: number): CalendarDay[] => {
    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay();
    const startDate = new Date(year, month, 1 - startDow);

    const totalCells = FIXED_WEEK_COUNT * 7;
    const days: CalendarDay[] = [];

    for (let i = 0; i < totalCells; i++) {
        const date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate() + i,
        );
        days.push({
            date,
            day: date.getDate(),
            outside: date.getMonth() !== month,
        });
    }

    return days;
};

export const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
