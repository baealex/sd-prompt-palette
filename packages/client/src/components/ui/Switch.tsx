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
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => {
                onCheckedChange(!checked);
            }}
            className={cn(
                'ui-focus-ring inline-flex h-11 w-11 items-center justify-center rounded-token-md border border-transparent bg-transparent disabled:cursor-not-allowed disabled:opacity-55',
                className,
            )}
        >
            <span
                className={cn(
                    'relative inline-flex h-4 w-8 items-center rounded-full border transition-colors',
                    checked
                        ? 'border-success-700 bg-success-700'
                        : 'border-line-strong bg-surface-muted',
                )}
                aria-hidden="true"
            >
                <span
                    className={cn(
                        'h-3 w-3 rounded-full bg-surface-raised shadow-surface transition-transform',
                        checked ? 'translate-x-[16px]' : 'translate-x-[2px]',
                    )}
                />
            </span>
        </button>
    );
};
