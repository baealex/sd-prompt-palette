import type { Collection } from '~/models/types';
import { Button } from '~/components/ui/Button';
import { formatDateTime } from '~/modules/date-time';

import { Image } from '~/components/ui/Image';

interface CollectionDetailCardProps {
    collection: Collection;
    onClickCopy: (text: string, label?: string) => void;
    onClickRename: () => void;
    onClickDelete: () => void;
    renaming?: boolean;
    removing?: boolean;
}

export const CollectionDetailCard = ({
    collection,
    onClickCopy,
    onClickRename,
    onClickDelete,
    renaming = false,
    removing = false,
}: CollectionDetailCardProps) => {
    const generatedMetadata = collection.generatedMetadata || null;
    const generatedAt = formatDateTime(collection.generatedAt || undefined);
    const metadataRows = generatedMetadata
        ? [
              { label: 'Source Type', value: generatedMetadata.sourceType },
              { label: 'Model', value: generatedMetadata.model },
              { label: 'Model Hash', value: generatedMetadata.modelHash },
              { label: 'Base Sampler', value: generatedMetadata.baseSampler },
              {
                  label: 'Base Scheduler',
                  value: generatedMetadata.baseScheduler,
              },
              {
                  label: 'Base Steps',
                  value: generatedMetadata.baseSteps?.toString(),
              },
              {
                  label: 'Base CFG',
                  value: generatedMetadata.baseCfgScale?.toString(),
              },
              { label: 'Base Seed', value: generatedMetadata.baseSeed },
              {
                  label: 'Upscale Sampler',
                  value: generatedMetadata.upscaleSampler,
              },
              {
                  label: 'Upscale Scheduler',
                  value: generatedMetadata.upscaleScheduler,
              },
              {
                  label: 'Upscale Steps',
                  value: generatedMetadata.upscaleSteps?.toString(),
              },
              {
                  label: 'Upscale CFG',
                  value: generatedMetadata.upscaleCfgScale?.toString(),
              },
              { label: 'Upscale Seed', value: generatedMetadata.upscaleSeed },
              {
                  label: 'Upscale Factor',
                  value: generatedMetadata.upscaleFactor?.toString(),
              },
              { label: 'Upscaler', value: generatedMetadata.upscaler },
              {
                  label: 'Size',
                  value:
                      generatedMetadata.sizeWidth &&
                      generatedMetadata.sizeHeight
                          ? `${generatedMetadata.sizeWidth} x ${generatedMetadata.sizeHeight}`
                          : undefined,
              },
              {
                  label: 'Clip Skip',
                  value: generatedMetadata.clipSkip?.toString(),
              },
              { label: 'VAE', value: generatedMetadata.vae },
              {
                  label: 'Denoise Strength',
                  value: generatedMetadata.denoiseStrength?.toString(),
              },
              { label: 'Parse Version', value: generatedMetadata.parseVersion },
          ].filter((item) => Boolean(item.value))
        : [];

    return (
        <article className="space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-xl font-semibold text-ink">
                        {collection.title || '(untitled)'}
                    </h2>
                    <p className="mt-1 text-xs text-ink-subtle">
                        {collection.image.width} x {collection.image.height}
                    </p>
                    <p className="mt-1 text-xs text-ink-subtle">
                        Generated At: {generatedAt || '-'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClickRename}
                        disabled={renaming}
                    >
                        {renaming ? 'Renaming...' : 'Rename'}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onClickDelete}
                        disabled={removing}
                    >
                        {removing ? 'Removing...' : 'Remove'}
                    </Button>
                </div>
            </header>

            <section className="rounded-token-lg bg-surface-muted p-3 md:p-4">
                <Image
                    className="mx-auto block h-auto max-h-[80vh] w-full max-w-[1080px] object-contain"
                    alt={collection.title || 'Collection image'}
                    src={collection.image.url}
                    width={collection.image.width}
                    height={collection.image.height}
                />
            </section>

            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                <span className="rounded-full bg-surface-muted px-2.5 py-1">
                    {collection.image.width} x {collection.image.height}
                </span>
            </div>

            <section className="space-y-4">
                <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">
                            Collection Prompt
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                onClickCopy(
                                    collection.prompt,
                                    'Collection prompt',
                                )
                            }
                        >
                            Copy
                        </Button>
                    </div>
                    <p className="rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                        {collection.prompt || '-'}
                    </p>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">
                            Collection Negative Prompt
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                onClickCopy(
                                    collection.negativePrompt,
                                    'Collection negative prompt',
                                )
                            }
                        >
                            Copy
                        </Button>
                    </div>
                    <p className="rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                        {collection.negativePrompt || '-'}
                    </p>
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">
                            Generated Metadata
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                onClickCopy(
                                    JSON.stringify(
                                        generatedMetadata || {},
                                        null,
                                        2,
                                    ),
                                    'Metadata JSON',
                                )
                            }
                        >
                            Copy JSON
                        </Button>
                    </div>

                    {metadataRows.length > 0 ? (
                        <div className="space-y-2 rounded-token-md border border-line bg-surface-muted px-3 py-2">
                            {metadataRows.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-start justify-between gap-3 text-xs"
                                >
                                    <p className="font-semibold text-ink">
                                        {item.label}
                                    </p>
                                    <p className="max-w-[70%] text-right text-ink-muted break-words">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-token-md border border-line bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
                            No generated metadata saved for this image.
                        </p>
                    )}
                </div>

                {generatedMetadata &&
                generatedMetadata.parseWarnings.length > 0 ? (
                    <div className="rounded-token-md border border-warning-200 bg-warning-50 px-3 py-2">
                        <p className="text-xs font-semibold text-warning-700">
                            Parse Warnings
                        </p>
                        <ul className="mt-1 space-y-1 text-xs text-warning-700">
                            {generatedMetadata.parseWarnings.map((warning) => (
                                <li key={warning}>- {warning}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </section>
        </article>
    );
};
