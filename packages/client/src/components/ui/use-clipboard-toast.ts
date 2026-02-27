import { useCallback } from 'react';

import { useToast } from './ToastProvider';

interface CopyOptions {
    label?: string;
    successMessage?: string;
    errorMessage?: string;
}

export const useClipboardToast = () => {
    const { pushToast } = useToast();

    const copyToClipboard = useCallback(async (text: string, options: CopyOptions = {}) => {
        try {
            await navigator.clipboard.writeText(text);
            pushToast({
                message: options.successMessage ?? `${options.label ?? 'Text'} copied`,
                variant: 'success',
            });
            return true;
        } catch {
            pushToast({
                message: options.errorMessage ?? 'Copy failed',
                variant: 'error',
            });
            return false;
        }
    }, [pushToast]);

    return { copyToClipboard };
};
