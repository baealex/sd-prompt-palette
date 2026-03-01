import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import type {
    ComponentPropsWithoutRef,
    ElementRef,
    ReactNode,
} from 'react';

import { Button } from './Button';
import { cn } from './cn';

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

type DialogOverlayElement = ElementRef<typeof DialogPrimitive.Overlay>;
type DialogOverlayProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;

export const DialogOverlay = forwardRef<DialogOverlayElement, DialogOverlayProps>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Overlay
            ref={ref}
            className={cn('fixed inset-0 z-40 bg-overlay/45', className)}
            {...props}
        />
    ),
);

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentElement = ElementRef<typeof DialogPrimitive.Content>;
type DialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

export const DialogContent = forwardRef<DialogContentElement, DialogContentProps>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-token-lg border border-line bg-surface-base p-5 shadow-overlay ui-focus-ring',
                className,
            )}
            {...props}
        />
    ),
);

DialogContent.displayName = DialogPrimitive.Content.displayName;

type DialogTitleElement = ElementRef<typeof DialogPrimitive.Title>;
type DialogTitleProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

export const DialogTitle = forwardRef<DialogTitleElement, DialogTitleProps>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Title
            ref={ref}
            className={cn('text-lg font-semibold text-ink', className)}
            {...props}
        />
    ),
);

DialogTitle.displayName = DialogPrimitive.Title.displayName;

type DialogDescriptionElement = ElementRef<typeof DialogPrimitive.Description>;
type DialogDescriptionProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

export const DialogDescription = forwardRef<
    DialogDescriptionElement,
    DialogDescriptionProps
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('mt-1 text-sm text-ink-muted', className)}
        {...props}
    />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

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
        <DialogRoot open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-w-lg">
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    ) : null}
                    <div className="mt-4">{children}</div>
                    <DialogClose asChild>
                        <Button className="mt-4" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    );
};
