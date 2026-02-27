import { useState } from 'react';
import { Link } from '@tanstack/react-router';

import { PageFrame } from '~/components/domain/PageFrame';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { FileInput } from '~/components/ui/FileInput';
import { Notice } from '~/components/ui/Notice';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';
import { useImageLoad } from '~/features/image-load/use-image-load';
import { HeartIcon } from '~/icons';

const formatDateTime = (value?: string) => {
    if (!value) {
        return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    const pad = (input: number) => String(input).padStart(2, '0');
    const year = parsed.getFullYear();
    const month = pad(parsed.getMonth() + 1);
    const day = pad(parsed.getDate());
    const hour = pad(parsed.getHours());
    const minute = pad(parsed.getMinutes());
    const second = pad(parsed.getSeconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export const ImageLoadPage = () => {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const { copyToClipboard } = useClipboardToast();

    const {
        loading,
        error,
        parsedPrompt,
        uploadedImage,
        selectedFileModifiedAt,
        savedCollectionId,
        onFile,
        saveToCollection,
    } = useImageLoad();

    const canSaveToCollection = Boolean(parsedPrompt && (parsedPrompt.prompt || parsedPrompt.negativePrompt));
    const metadataRows = parsedPrompt
        ? [
            { label: 'Source Type', value: parsedPrompt.sourceType },
            { label: 'Model', value: parsedPrompt.model },
            { label: 'Model Hash', value: parsedPrompt.modelHash },
            { label: 'Base Sampler', value: parsedPrompt.baseSampler },
            { label: 'Base Scheduler', value: parsedPrompt.baseScheduler },
            { label: 'Base Steps', value: parsedPrompt.baseSteps?.toString() },
            { label: 'Base CFG', value: parsedPrompt.baseCfgScale?.toString() },
            { label: 'Base Seed', value: parsedPrompt.baseSeed },
            { label: 'Upscale Sampler', value: parsedPrompt.upscaleSampler },
            { label: 'Upscale Scheduler', value: parsedPrompt.upscaleScheduler },
            { label: 'Upscale Steps', value: parsedPrompt.upscaleSteps?.toString() },
            { label: 'Upscale CFG', value: parsedPrompt.upscaleCfgScale?.toString() },
            { label: 'Upscale Seed', value: parsedPrompt.upscaleSeed },
            { label: 'Upscale Factor', value: parsedPrompt.upscaleFactor?.toString() },
            { label: 'Upscaler', value: parsedPrompt.upscaler },
            {
                label: 'Size',
                value:
                    parsedPrompt.sizeWidth && parsedPrompt.sizeHeight
                        ? `${parsedPrompt.sizeWidth} x ${parsedPrompt.sizeHeight}`
                        : undefined,
            },
            { label: 'Clip Skip', value: parsedPrompt.clipSkip?.toString() },
            { label: 'VAE', value: parsedPrompt.vae },
            { label: 'Denoise Strength', value: parsedPrompt.denoiseStrength?.toString() },
            { label: 'Generated At', value: formatDateTime(parsedPrompt.createdAtFromMeta || selectedFileModifiedAt || undefined) },
            { label: 'File Modified (Local)', value: formatDateTime(selectedFileModifiedAt || undefined) },
            { label: 'File Created (FS)', value: formatDateTime(uploadedImage?.fileCreatedAt || undefined) },
            { label: 'File Modified (FS)', value: formatDateTime(uploadedImage?.fileModifiedAt || undefined) },
            { label: 'Parse Version', value: parsedPrompt.parseVersion },
        ].filter((item) => Boolean(item.value))
        : [];

    return (
        <PageFrame
            title="Stable Diffusion Prompt Info"
            description="Load PNG/JPG/WEBP files to read generation metadata and save it to collection."
        >
            <div className="grid gap-4 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
                <div className="space-y-4">
                    <FileInput
                        accept="image/png,image/jpeg,image/webp"
                        disabled={loading}
                        helperText="Select an image file to extract prompt metadata and preview before saving."
                        onSelect={(file) => {
                            void onFile(file);
                        }}
                    />

                    <section className="rounded-token-md border border-brand-200 bg-brand-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Next Step</p>
                        <p className="mt-1 text-xs text-ink-muted">
                            Create a collection item from parsed prompt metadata.
                        </p>
                        <Button
                            variant="primary"
                            className="mt-3 w-full"
                            onClick={() => setSaveDialogOpen(true)}
                            disabled={loading || !canSaveToCollection}
                        >
                            <HeartIcon width={14} height={14} />
                            Save Prompt to Collection
                        </Button>
                    </section>
                </div>

                <div className="space-y-4">
                    {parsedPrompt ? (
                        <Card className="text-sm text-ink-muted">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-base font-semibold text-ink">Prompt</h2>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        void copyToClipboard(parsedPrompt.prompt, { label: 'Prompt' });
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="whitespace-pre-wrap break-words rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink">
                                {parsedPrompt.prompt || 'No prompt found in metadata.'}
                            </p>

                            <div className="mb-3 mt-5 flex items-center justify-between gap-3">
                                <h2 className="text-base font-semibold text-ink">Negative Prompt</h2>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        void copyToClipboard(parsedPrompt.negativePrompt, { label: 'Negative prompt' });
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="whitespace-pre-wrap break-words rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink">
                                {parsedPrompt.negativePrompt || 'No negative prompt found in metadata.'}
                            </p>

                            <div className="mb-3 mt-5 flex items-center justify-between gap-3">
                                <h2 className="text-base font-semibold text-ink">Generated Metadata</h2>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        void copyToClipboard(JSON.stringify(parsedPrompt, null, 2), { label: 'Metadata JSON' });
                                    }}
                                >
                                    Copy JSON
                                </Button>
                            </div>
                            {metadataRows.length > 0 ? (
                                <>
                                    <div className="space-y-2 rounded-token-md border border-line bg-surface-muted p-3">
                                        {metadataRows.map((item) => (
                                            <div key={item.label} className="flex flex-wrap items-start justify-between gap-2 text-xs">
                                                <p className="font-semibold text-ink">{item.label}</p>
                                                <p className="max-w-[72%] text-right text-ink-muted break-words">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {!uploadedImage ? (
                                        <p className="mt-2 text-xs text-ink-subtle">
                                            File system timestamps appear after saving to collection.
                                        </p>
                                    ) : null}
                                </>
                            ) : (
                                <p className="rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink-muted">
                                    No structured metadata fields were found.
                                </p>
                            )}

                            {parsedPrompt.parseWarnings.length > 0 ? (
                                <div className="mt-3 rounded-token-md border border-warning-200 bg-warning-50 px-3 py-2">
                                    <p className="text-xs font-semibold text-warning-700">Parse Warnings</p>
                                    <ul className="mt-1 space-y-1 text-xs text-warning-700">
                                        {parsedPrompt.parseWarnings.map((warning) => (
                                            <li key={warning}>- {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </Card>
                    ) : (
                        <Card tone="muted" className="text-sm text-ink-muted">
                            <p className="text-ink-muted">
                                Prompt metadata will appear here after you select an image.
                            </p>
                        </Card>
                    )}

                    {savedCollectionId ? (
                        <Notice variant="success">
                            Saved to collection #{savedCollectionId}.{' '}
                            <Link
                                to="/collection/$id"
                                params={{ id: String(savedCollectionId) }}
                                className="underline"
                            >
                                Open detail
                            </Link>
                        </Notice>
                    ) : null}

                    {error ? (
                        <Notice variant="error">{error}</Notice>
                    ) : null}
                </div>
            </div>

            <PromptDialog
                open={saveDialogOpen}
                title="Save Prompt to Collection"
                description="Enter a collection title for this Stable Diffusion prompt."
                placeholder="Collection title"
                confirmLabel="Save"
                submitting={loading}
                onSubmit={(title) => {
                    void saveToCollection(title);
                    setSaveDialogOpen(false);
                }}
                onOpenChange={setSaveDialogOpen}
            />
        </PageFrame>
    );
};
