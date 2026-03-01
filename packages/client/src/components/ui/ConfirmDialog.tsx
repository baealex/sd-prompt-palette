import type { ReactNode } from 'react';

import { Button } from './Button';
import {
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from './Dialog';

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
        <DialogRoot open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-w-md">
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription asChild className="mt-2">
                            <div className="mt-2 text-sm text-ink-muted">
                                {description}
                            </div>
                        </DialogDescription>
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
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    );
};
