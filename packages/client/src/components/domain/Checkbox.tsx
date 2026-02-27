interface CheckboxProps {
    name: string;
    label: string;
    checked: boolean;
    onChange: (nextChecked: boolean, name: string) => void;
}

export const Checkbox = ({ name, label, checked, onChange }: CheckboxProps) => {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={(event) => onChange(event.target.checked, name)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-brand-500"
            />
            {label}
        </label>
    );
};
