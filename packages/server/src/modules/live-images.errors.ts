export function hasErrorCode(error: unknown, code: string): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    if (!('code' in error)) {
        return false;
    }

    return (error as { code?: unknown }).code === code;
}

export function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
