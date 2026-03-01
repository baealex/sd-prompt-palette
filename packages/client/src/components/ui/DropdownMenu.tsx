import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef } from 'react';
import type {
    ComponentPropsWithoutRef,
    ElementRef,
} from 'react';

import { cn } from './cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

type DropdownMenuContentElement = ElementRef<typeof DropdownMenuPrimitive.Content>;
type DropdownMenuContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;

export const DropdownMenuContent = forwardRef<
    DropdownMenuContentElement,
    DropdownMenuContentProps
>(({ className, align = 'end', sideOffset = 8, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                'z-40 min-w-[152px] overflow-hidden rounded-token-md border border-line bg-surface-base p-1 shadow-raised',
                className,
            )}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

type DropdownMenuItemElement = ElementRef<typeof DropdownMenuPrimitive.Item>;
type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>;

export const DropdownMenuItem = forwardRef<
    DropdownMenuItemElement,
    DropdownMenuItemProps
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            'ui-focus-ring flex h-11 cursor-default select-none items-center rounded-token-sm px-3 text-xs font-semibold text-ink-muted outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-surface-muted data-[highlighted]:text-ink',
            className,
        )}
        {...props}
    />
));

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

type DropdownMenuSeparatorElement = ElementRef<typeof DropdownMenuPrimitive.Separator>;
type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>;

export const DropdownMenuSeparator = forwardRef<
    DropdownMenuSeparatorElement,
    DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={cn('my-1 h-px bg-line', className)}
        {...props}
    />
));

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
