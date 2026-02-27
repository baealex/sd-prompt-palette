export const cn = (...values: Array<string | false | null | undefined>) => {
    return values.filter(Boolean).join(' ');
};

