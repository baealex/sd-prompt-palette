import { useEffect, useRef, useState } from 'react';

import { Button } from './Button';

interface FileInputProps {
    accept?: string;
    disabled?: boolean;
    helperText?: string;
    onSelect: (file: File | null) => void;
}

const formatFileSize = (size: number) => {
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

export const FileInput = ({
    accept,
    disabled = false,
    helperText = 'Select an image file (PNG, JPG, WEBP)',
    onSelect,
}: FileInputProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
        };
    }, []);

    const updatePreview = (file: File | null) => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        if (!file || !file.type.startsWith('image/')) {
            setPreviewUrl(null);
            return;
        }

        const nextPreviewUrl = URL.createObjectURL(file);
        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
    };

    const handleSelect = (file: File | null) => {
        setSelectedFile(file);
        updatePreview(file);
        onSelect(file);
    };

    return (
        <div className="rounded-token-lg border border-line bg-surface-base p-3 shadow-surface">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                disabled={disabled}
                onChange={(event) => {
                    handleSelect(event.target.files?.[0] ?? null);
                }}
            />

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                >
                    Choose File
                </Button>
                {selectedFile ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                            if (inputRef.current) {
                                inputRef.current.value = '';
                            }
                            handleSelect(null);
                        }}
                    >
                        Clear
                    </Button>
                ) : null}
                <p className="text-sm text-ink-muted">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                </p>
            </div>

            <p className="mt-2 text-xs text-ink-subtle">{helperText}</p>

            {selectedFile ? (
                <p className="mt-2 text-xs text-ink-subtle">
                    {selectedFile.type || 'unknown'} | {formatFileSize(selectedFile.size)}
                </p>
            ) : null}

            {previewUrl ? (
                <div className="mt-3 overflow-hidden rounded-token-md border border-line bg-surface-muted">
                    <img
                        src={previewUrl}
                        alt={selectedFile?.name ?? 'Selected preview'}
                        className="block h-auto w-full"
                    />
                </div>
            ) : null}
        </div>
    );
};
