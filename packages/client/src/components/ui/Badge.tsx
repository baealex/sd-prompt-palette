import type { HTMLAttributes } from 'react';

import { cn } from './cn';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
    neutral: 'border-line-strong bg-surface-muted text-ink-muted',
    info: 'border-info-200 bg-info-50 text-info-700',
    success: 'border-success-200 bg-success-50 text-success-700',
    warning: 'border-warning-200 bg-warning-50 text-warning-700',
    danger: 'border-danger-200 bg-danger-50 text-danger-700',
};

export const Badge = ({ variant = 'neutral', className, ...props }: BadgeProps) => {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                VARIANT_CLASS[variant],
                className,
            )}
            {...props}
        />
    );
};

