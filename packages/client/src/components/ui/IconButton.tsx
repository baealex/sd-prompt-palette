import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

type IconButtonVariant = 'secondary' | 'ghost' | 'danger';
type IconButtonSize = 'sm' | 'md';

interface IconButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    icon: ReactNode;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    label: string;
}

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
    secondary:
        'border-line-strong bg-surface-base text-ink-muted shadow-surface hover:bg-surface-muted',
    ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-surface-muted',
    danger: 'border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-200',
};

const SIZE_CLASS: Record<IconButtonSize, string> = {
    sm: 'h-11 w-11',
    md: 'h-11 w-11',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            icon,
            variant = 'secondary',
            size = 'md',
            label,
            className,
            type = 'button',
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                type={type}
                aria-label={label}
                className={cn(
                    'ui-focus-ring inline-flex items-center justify-center rounded-token-md border transition-colors disabled:cursor-not-allowed disabled:opacity-55',
                    VARIANT_CLASS[variant],
                    SIZE_CLASS[size],
                    className,
                )}
                {...props}
            >
                {icon}
            </button>
        );
    },
);

IconButton.displayName = 'IconButton';
