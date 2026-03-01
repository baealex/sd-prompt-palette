import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { forwardRef } from 'react';
import type {
    ComponentPropsWithoutRef,
    ElementRef,
} from 'react';

import { cn } from './cn';

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

type HoverCardContentElement = ElementRef<typeof HoverCardPrimitive.Content>;
type HoverCardContentProps = ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>;

export const HoverCardContent = forwardRef<
    HoverCardContentElement,
    HoverCardContentProps
>(({ className, sideOffset = 8, ...props }, ref) => (
    <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                'z-40 overflow-hidden rounded-token-md border border-line bg-surface-base shadow-raised',
                className,
            )}
            {...props}
        />
    </HoverCardPrimitive.Portal>
));

HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
