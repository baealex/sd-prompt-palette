import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';

import { Button } from './Button';
import { Input } from './Input';

interface PromptDialogProps {
    open: boolean;
    title: string;
    description?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    submitting?: boolean;
    onSubmit: (value: string) => void;
    onOpenChange: (open: boolean) => void;
}

export const PromptDialog = ({
    open,
    title,
    description,
    defaultValue = '',
    placeholder,
    confirmLabel = 'Save',
    cancelLabel = 'Cancel',
    submitting = false,
    onSubmit,
    onOpenChange,
}: PromptDialogProps) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
        }
    }, [defaultValue, open]);

    const handleSubmit = () => {
        const nextValue = value.trim();
        if (!nextValue) {
            return;
        }
        onSubmit(nextValue);
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-900/45" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-token-lg border border-line bg-surface-base p-5 shadow-overlay ui-focus-ring">
                    <DialogPrimitive.Title className="text-lg font-semibold text-ink">
                        {title}
                    </DialogPrimitive.Title>
                    {description ? (
                        <DialogPrimitive.Description className="mt-2 text-sm text-ink-muted">
                            {description}
                        </DialogPrimitive.Description>
                    ) : null}
                    <Input
                        className="mt-4"
                        value={value}
                        placeholder={placeholder}
                        onChange={(event) => setValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <div className="mt-5 flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={submitting || value.trim().length === 0}
                        >
                            {submitting ? 'Saving...' : confirmLabel}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

