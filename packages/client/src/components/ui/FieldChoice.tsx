import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

interface FieldChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
    type: 'checkbox' | 'radio';
    checked: boolean;
    label: ReactNode;
    onChange: (nextChecked: boolean) => void;
}

export const FieldChoice = ({
    type,
    checked,
    label,
    onChange,
    className,
    disabled = false,
    ...props
}: FieldChoiceProps) => {
    return (
        <label className={cn('inline-flex items-center gap-2 text-sm text-ink-muted', disabled ? 'opacity-55' : '', className)}>
            <input
                type={type}
                checked={checked}
                disabled={disabled}
                onChange={(event) => {
                    onChange(event.target.checked);
                }}
                className="ui-focus-ring h-4 w-4"
                {...props}
            />
            {label}
        </label>
    );
};

