import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, invalid = false, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    'ui-focus-ring h-11 w-full rounded-token-md border bg-surface-base px-3 text-sm text-ink transition-colors placeholder:text-ink-subtle',
                    invalid ? 'border-danger-700' : 'border-line-strong focus-visible:border-brand-500',
                    className,
                )}
                {...props}
            />
        );
    },
);

Input.displayName = 'Input';

