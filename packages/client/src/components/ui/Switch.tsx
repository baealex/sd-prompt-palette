import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from './cn';

interface SwitchProps {
    checked: boolean;
    disabled?: boolean;
    label: string;
    onCheckedChange: (nextChecked: boolean) => void;
    className?: string;
}

export const Switch = ({
    checked,
    disabled = false,
    label,
    onCheckedChange,
    className,
}: SwitchProps) => {
    return (
        <SwitchPrimitive.Root
            checked={checked}
            aria-label={label}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            className={cn(
                'ui-focus-ring inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-55',
                checked
                    ? 'border-success-700 bg-success-700'
                    : 'border-line-strong bg-surface-muted',
                className,
            )}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'h-5 w-5 rounded-full bg-surface-raised shadow-surface transition-transform',
                    checked ? 'translate-x-[20px]' : 'translate-x-[2px]',
                )}
            />
        </SwitchPrimitive.Root>
    );
};
