import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const BASE_CLASS = 'ui-focus-ring inline-flex items-center justify-center gap-2 rounded-token-md font-semibold tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-55';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    primary: 'border border-brand-700 bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-surface hover:from-brand-700 hover:to-brand-800',
    secondary: 'border border-line-strong bg-surface-base text-ink-muted shadow-surface hover:bg-surface-muted',
    danger: 'border border-danger-700 bg-gradient-to-b from-danger-700 to-red-800 text-white shadow-surface hover:from-red-700 hover:to-red-900',
    ghost: 'border border-transparent bg-transparent text-ink-muted hover:bg-surface-muted',
    soft: 'border border-brand-200 bg-brand-50 text-brand-800 shadow-surface hover:bg-brand-100',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
    sm: 'h-10 px-3 text-xs',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-sm',
    icon: 'h-11 w-11',
};

export const Button = ({
    variant = 'secondary',
    size = 'md',
    className,
    type = 'button',
    ...props
}: ButtonProps) => {
    return (
        <button
            type={type}
            className={cn(BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
            {...props}
        />
    );
};
