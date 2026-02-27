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

export const ImageLoadPage = () => {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const { copyToClipboard } = useClipboardToast();

    const {
        loading,
        error,
        parsedPrompt,
        savedCollectionId,
        onFile,
        saveToCollection,
    } = useImageLoad();

    const canSaveToCollection = Boolean(parsedPrompt && (parsedPrompt.prompt || parsedPrompt.negativePrompt));

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
