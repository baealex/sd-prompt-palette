import { cn } from '~/components/ui/cn';

interface CheckboxProps {
    name: string;
    label: string;
    checked: boolean;
    meta?: string;
    disabled?: boolean;
    onChange: (nextChecked: boolean, name: string) => void;
}

export const Checkbox = ({ name, label, checked, meta, disabled = false, onChange }: CheckboxProps) => {
    return (
        <label
            className={cn(
                'group flex min-h-11 cursor-pointer items-center gap-3 rounded-token-md border px-3 py-2 transition-colors',
                checked
                    ? 'border-brand-200 bg-brand-50 text-brand-900 shadow-surface'
                    : 'border-line bg-surface-base text-ink hover:border-brand-200 hover:bg-surface-muted',
                disabled ? 'cursor-not-allowed opacity-55' : '',
            )}
        >
            <input
                type="checkbox"
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked, name)}
                className="peer sr-only"
            />
            <span
                aria-hidden
                className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-token-sm border text-[11px] leading-none transition-colors',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-base',
                    checked
                        ? 'border-brand-700 bg-brand-700 text-ink-inverse'
                        : 'border-line-strong bg-surface-base text-transparent group-hover:border-brand-300',
                )}
            >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                </svg>
            </span>
            <span className="flex flex-1 items-center justify-between gap-3">
                <span className="text-sm font-semibold">{label}</span>
                {meta ? (
                    <span className={cn('text-xs font-medium', checked ? 'text-brand-800' : 'text-ink-subtle')}>
                        {meta}
                    </span>
                ) : null}
            </span>
        </label>
    );
};
