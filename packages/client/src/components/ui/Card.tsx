import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

type CardTone = 'default' | 'muted';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardEmphasis = 'none' | 'flat' | 'brand' | 'brandGlow';

interface CardProps extends HTMLAttributes<HTMLElement> {
    as?: 'article' | 'section' | 'div' | 'li';
    tone?: CardTone;
    padding?: CardPadding;
    emphasis?: CardEmphasis;
    children?: ReactNode;
}

const TONE_CLASS: Record<CardTone, string> = {
    default: 'bg-surface-base',
    muted: 'bg-surface-muted',
};

const PADDING_CLASS: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6',
};

const EMPHASIS_CLASS: Record<CardEmphasis, string> = {
    none: 'border border-line shadow-surface',
    flat: 'border border-line',
    brand: 'border-2 border-brand-200 shadow-surface',
    brandGlow: 'border-2 border-brand-200 shadow-surface shadow-brand-300/50',
};

export const Card = forwardRef<HTMLElement, CardProps>(
    (
        {
            as = 'div',
            tone = 'default',
            padding = 'md',
            emphasis = 'none',
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const Component = as;
        return (
            <Component
                ref={ref as never}
                className={cn(
                    'rounded-token-lg bg-clip-padding',
                    TONE_CLASS[tone],
                    PADDING_CLASS[padding],
                    EMPHASIS_CLASS[emphasis],
                    className,
                )}
                {...props}
            >
                {children}
            </Component>
        );
    },
);

Card.displayName = 'Card';
