import * as PopoverPrimitive from '@radix-ui/react-popover';
import { forwardRef } from 'react';
import type {
    ComponentPropsWithoutRef,
    ElementRef,
} from 'react';

import { cn } from './cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

type PopoverContentElement = ElementRef<typeof PopoverPrimitive.Content>;
type PopoverContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

export const PopoverContent = forwardRef<
    PopoverContentElement,
    PopoverContentProps
>(({ className, align = 'start', sideOffset = 8, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                'z-50 overflow-hidden rounded-token-lg border border-line bg-surface-base shadow-overlay',
                className,
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
));

PopoverContent.displayName = PopoverPrimitive.Content.displayName;
