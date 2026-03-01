import { useEffect, useState } from 'react';

import { Button } from './Button';
import {
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from './Dialog';
import { Input } from './Input';

interface PromptDialogProps {
    open: boolean;
    title: string;
    description?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    submitting?: boolean;
    onSubmit: (value: string) => void;
    onOpenChange: (open: boolean) => void;
}

export const PromptDialog = ({
    open,
    title,
    description,
    defaultValue = '',
    placeholder,
    confirmLabel = 'Save',
    cancelLabel = 'Cancel',
    submitting = false,
    onSubmit,
    onOpenChange,
}: PromptDialogProps) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
        }
    }, [defaultValue, open]);

    const handleSubmit = () => {
        const nextValue = value.trim();
        if (!nextValue) {
            return;
        }
        onSubmit(nextValue);
    };

    return (
        <DialogRoot open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-w-md">
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    {description ? (
                        <DialogDescription className="mt-2">
                            {description}
                        </DialogDescription>
                    ) : null}
                    <Input
                        className="mt-4"
                        value={value}
                        placeholder={placeholder}
                        onChange={(event) => setValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <div className="mt-5 flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={submitting || value.trim().length === 0}
                        >
                            {submitting ? 'Saving...' : confirmLabel}
                        </Button>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>
    );
};
