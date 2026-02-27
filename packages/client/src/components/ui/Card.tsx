import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

type CardTone = 'default' | 'muted';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLElement> {
    as?: 'article' | 'section' | 'div';
    tone?: CardTone;
    padding?: CardPadding;
    children?: ReactNode;
}

const TONE_CLASS: Record<CardTone, string> = {
    default: 'bg-surface-base',
    muted: 'bg-surface-muted',
};

const PADDING_CLASS: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export const Card = ({
    as = 'div',
    tone = 'default',
    padding = 'md',
    className,
    children,
    ...props
}: CardProps) => {
    const Component = as;
    return (
        <Component
            className={cn(
                'rounded-token-lg border border-line bg-clip-padding shadow-surface',
                TONE_CLASS[tone],
                PADDING_CLASS[padding],
                className,
            )}
            {...props}
        >
            {children}
        </Component>
    );
};
