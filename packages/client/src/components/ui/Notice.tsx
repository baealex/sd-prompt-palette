import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

type NoticeVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: NoticeVariant;
    title?: string;
    children?: ReactNode;
}

const VARIANT_CLASS: Record<NoticeVariant, string> = {
    info: 'border-info-200 bg-info-50 text-info-700',
    success: 'border-success-200 bg-success-50 text-success-700',
    warning: 'border-warning-200 bg-warning-50 text-warning-700',
    error: 'border-danger-200 bg-danger-50 text-danger-700',
    neutral: 'border-line bg-surface-muted text-ink-muted',
};

export const Notice = ({ variant = 'neutral', title, className, children, ...props }: NoticeProps) => {
    return (
        <div
            role="status"
            className={cn('rounded-token-md border p-3 text-sm', VARIANT_CLASS[variant], className)}
            {...props}
        >
            {title ? <p className="mb-1 font-semibold">{title}</p> : null}
            {children}
        </div>
    );
};

