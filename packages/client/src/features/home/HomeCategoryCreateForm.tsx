import type { FormEvent } from 'react';

import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

interface HomeCategoryCreateFormProps {
    value: string;
    saving: boolean;
    onValueChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const HomeCategoryCreateForm = ({
    value,
    saving,
    onValueChange,
    onSubmit,
}: HomeCategoryCreateFormProps) => {
    return (
        <form
            onSubmit={onSubmit}
            className="mb-4 flex flex-wrap gap-2"
        >
            <Input
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder="Enter a category"
                className="min-w-[240px] flex-1"
                disabled={saving}
            />
            <Button type="submit" variant="primary" disabled={saving}>
                Add Category
            </Button>
        </form>
    );
};
