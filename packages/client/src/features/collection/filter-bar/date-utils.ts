import dayjs from 'dayjs';

const STORAGE_DATE_FORMAT = 'YYYY-MM-DDTHH:mm';

export type DateFilterMode = 'single' | 'range';

export const parseDateValue = (value: string) => {
    if (!value) {
        return null;
    }

    const parsed = dayjs(value);
    if (!parsed.isValid()) {
        return null;
    }

    return parsed;
};

export const formatStorageDateTime = (value: dayjs.Dayjs) =>
    value.format(STORAGE_DATE_FORMAT);

export const resolveSingleDay = (dateFrom: string, dateTo: string) => {
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

export const isSameCalendarDay = (dateFrom: string, dateTo: string) => {
    const parsedFrom = parseDateValue(dateFrom);
    const parsedTo = parseDateValue(dateTo);

    if (!parsedFrom || !parsedTo) {
        return false;
    }

    return parsedFrom.isSame(parsedTo, 'day');
};

export const resolveDateFilterMode = (
    dateFrom: string,
    dateTo: string,
): DateFilterMode => {
    if (!dateFrom && !dateTo) {
        return 'single';
    }

    return isSameCalendarDay(dateFrom, dateTo) ? 'single' : 'range';
};
