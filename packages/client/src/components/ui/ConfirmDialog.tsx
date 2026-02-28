import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Button } from './Button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirming?: boolean;
    danger?: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
}

export const ConfirmDialog = ({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirming = false,
    danger = false,
    onConfirm,
    onOpenChange,
}: ConfirmDialogProps) => {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay/45" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-token-lg border border-line bg-surface-base p-5 shadow-overlay ui-focus-ring">
                    <DialogPrimitive.Title className="text-lg font-semibold text-ink">
                        {title}
                    </DialogPrimitive.Title>
                    {description ? (
                        <DialogPrimitive.Description asChild>
                            <div className="mt-2 text-sm text-ink-muted">
                                {description}
                            </div>
                        </DialogPrimitive.Description>
                    ) : null}
                    <div className="mt-5 flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={confirming}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant={danger ? 'danger' : 'primary'}
                            onClick={onConfirm}
                            disabled={confirming}
                        >
                            {confirming ? 'Processing...' : confirmLabel}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};
