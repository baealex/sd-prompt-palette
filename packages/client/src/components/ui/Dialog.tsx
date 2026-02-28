import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Button } from './Button';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactNode;
    title: string;
    description?: string;
    children: ReactNode;
}

export const Dialog = ({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    children,
}: DialogProps) => {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay/45" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-token-lg border border-line bg-surface-base p-5 shadow-overlay ui-focus-ring">
                    <DialogPrimitive.Title className="text-lg font-semibold text-ink">
                        {title}
                    </DialogPrimitive.Title>
                    {description ? (
                        <DialogPrimitive.Description className="mt-1 text-sm text-ink-muted">
                            {description}
                        </DialogPrimitive.Description>
                    ) : null}
                    <div className="mt-4">{children}</div>
                    <DialogPrimitive.Close asChild>
                        <Button className="mt-4" variant="secondary">
                            Close
                        </Button>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};
