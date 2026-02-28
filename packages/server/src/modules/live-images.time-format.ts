import dayjs from 'dayjs';

interface DatePathSegments {
    year: string;
    month: string;
    day: string;
}

export function resolveDatePathSegments(input: Date): DatePathSegments {
    const normalized = dayjs(input);
    return {
        year: normalized.format('YYYY'),
        month: normalized.format('M'),
        day: normalized.format('D'),
    };
}

export function resolveServerTimeToken(serverRegisteredAtMs: number): string {
    const normalized = Number.isFinite(serverRegisteredAtMs)
        ? dayjs(Math.trunc(serverRegisteredAtMs))
        : dayjs();
    return normalized.format('HHmmss');
}

export function resolveCreatedAtEpochToken(input: Date): string {
    return String(dayjs(input).valueOf());
}
