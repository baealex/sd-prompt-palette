import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

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
                <DialogPrimitive.Overlay className="fixed inset-0 bg-slate-900/40" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl focus:outline-none">
                    <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">
                        {title}
                    </DialogPrimitive.Title>
                    {description ? (
                        <DialogPrimitive.Description className="mt-1 text-sm text-slate-600">
                            {description}
                        </DialogPrimitive.Description>
                    ) : null}
                    <div className="mt-4">{children}</div>
                    <DialogPrimitive.Close className="mt-4 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                        Close
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};
