import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import type { Image } from '~/models';
import { errorMessage, hasErrorCode } from './live-images.errors';
import { LiveImagesImageRepository } from './live-images.image-repository';
import {
    buildLegacyPromptText,
    toStoredImageMetaInput,
} from './live-images.metadata';
import { readImageMetadata } from './prompt-reader';
import type {
    IngestMode,
    PromptCacheItem,
    RegisterLibraryFileOptions,
} from './live-images.types';
import {
    absolutePathFromImageUrl,
    deriveCreatedAt,
    hashFile,
    imageUrlFromAbsolutePath,
    resolveGeneratedAt,
} from './live-images.utils';

interface LiveImagesLibraryManagerOptions {
    imageBaseDirPath: string;
    imageRepository: LiveImagesImageRepository;
    promptCache: Map<number, PromptCacheItem>;
    getIngestMode: () => IngestMode;
    warn: (message: string) => void;
}

interface RegisterLibraryFileInput {
    absolutePath: string;
    options?: RegisterLibraryFileOptions;
}

interface UpsertSourceLinkInput {
    imageId: number;
    sourcePath?: string;
}

interface EnsureCollectionInput {
    image: Image;
    absolutePath: string;
}

interface UpsertImageMetadataForPathInput {
    imageId: number;
    absolutePath: string;
}

export class LiveImagesLibraryManager {
    private readonly imageBaseDirPath: string;
    private readonly imageRepository: LiveImagesImageRepository;
    private readonly promptCache: Map<number, PromptCacheItem>;
    private readonly getIngestMode: () => IngestMode;
    private readonly warn: (message: string) => void;

    constructor(options: LiveImagesLibraryManagerOptions) {
        this.imageBaseDirPath = options.imageBaseDirPath;
        this.imageRepository = options.imageRepository;
        this.promptCache = options.promptCache;
        this.getIngestMode = options.getIngestMode;
        this.warn = options.warn;
    }

    imageUrlFromAbsolutePath(absolutePath: string): string | null {
        return imageUrlFromAbsolutePath(this.imageBaseDirPath, absolutePath);
    }

    absolutePathFromImageUrl(url: string): string | null {
        return absolutePathFromImageUrl(this.imageBaseDirPath, url);
    }

    async readStatIfExists(targetPath: string): Promise<fs.Stats | null> {
        try {
            return await fs.promises.stat(targetPath);
        } catch (error: unknown) {
            if (hasErrorCode(error, 'ENOENT')) {
                return null;
            }
            throw error;
        }
    }

    async unlinkIfExists(targetPath: string): Promise<void> {
        try {
            await fs.promises.unlink(targetPath);
        } catch (error: unknown) {
            if (!hasErrorCode(error, 'ENOENT')) {
                throw error;
            }
        }
    }

    async deleteImageRecord(imageId: number): Promise<void> {
        await this.imageRepository.deleteImageAndRelations(imageId);
        this.promptCache.delete(imageId);
    }

    async registerLibraryFile({
        absolutePath,
        options = {},
    }: RegisterLibraryFileInput): Promise<Image> {
        const url = this.imageUrlFromAbsolutePath(absolutePath);
        if (!url) {
            throw new Error('invalid library path');
        }

        const stats = await fs.promises.stat(absolutePath);
        const hash = options.knownHash || (await hashFile(absolutePath));
        const imageMeta = await sharp(absolutePath).metadata();
        const width = imageMeta.width || 0;
        const height = imageMeta.height || 0;
        const createdAt =
            options.preferredDate || (await deriveCreatedAt(absolutePath, stats));
        const generatedAt = resolveGeneratedAt(stats);
        const ensureCollectionForExisting = Boolean(
            options.ensureCollectionForExisting,
        );

        const existingByHash = await this.imageRepository.findImageByHash(hash);
        if (existingByHash) {
            let promptSourcePath = absolutePath;
            if (existingByHash.url !== url) {
                await this.unlinkIfExists(absolutePath);
                const existingPath = this.absolutePathFromImageUrl(
                    existingByHash.url,
                );
                if (existingPath) {
                    promptSourcePath = existingPath;
                }
            }

            const updated = await this.imageRepository.updateImage(
                existingByHash.id,
                {
                    width,
                    height,
                    createdAt,
                    generatedAt,
                },
            );
            await this.upsertImageMetadataForPath({
                imageId: updated.id,
                absolutePath: promptSourcePath,
            });
            if (ensureCollectionForExisting) {
                await this.ensureCollectionForImage({
                    image: updated,
                    absolutePath: promptSourcePath,
                });
            }
            await this.upsertSourceLinkIfNeeded({
                imageId: updated.id,
                sourcePath: options.sourcePath,
            });
            return updated;
        }

        const existingByUrl = await this.imageRepository.findImageByUrl(url);
        if (existingByUrl) {
            const updated = await this.imageRepository.updateImage(
                existingByUrl.id,
                {
                    hash,
                    width,
                    height,
                    createdAt,
                    generatedAt,
                },
            );
            await this.upsertImageMetadataForPath({
                imageId: updated.id,
                absolutePath,
            });
            if (ensureCollectionForExisting) {
                await this.ensureCollectionForImage({
                    image: updated,
                    absolutePath,
                });
            }
            await this.upsertSourceLinkIfNeeded({
                imageId: updated.id,
                sourcePath: options.sourcePath,
            });
            return updated;
        }

        const created = await this.imageRepository.createImage({
            hash,
            url,
            width,
            height,
            createdAt,
            generatedAt,
        });
        await this.upsertImageMetadataForPath({
            imageId: created.id,
            absolutePath,
        });
        await this.ensureCollectionForImage({
            image: created,
            absolutePath,
        });
        await this.upsertSourceLinkIfNeeded({
            imageId: created.id,
            sourcePath: options.sourcePath,
        });
        return created;
    }

    private async upsertSourceLinkIfNeeded({
        imageId,
        sourcePath,
    }: UpsertSourceLinkInput): Promise<void> {
        if (sourcePath && this.getIngestMode() === 'copy') {
            await this.imageRepository.upsertSourceLink(imageId, sourcePath);
        }
    }

    private async ensureCollectionForImage({
        image,
        absolutePath,
    }: EnsureCollectionInput): Promise<void> {
        const exists = await this.imageRepository.collectionExists(image.id);
        if (exists) {
            return;
        }
        const metadata = await readImageMetadata(absolutePath);
        const prompt = metadata.prompt || '';
        const negativePrompt = metadata.negativePrompt || '';

        const fileName = path.basename(absolutePath);
        await this.imageRepository.createCollectionForImage({
            imageId: image.id,
            title: fileName,
            prompt,
            negativePrompt,
        });
    }

    private async upsertImageMetadataForPath({
        imageId,
        absolutePath,
    }: UpsertImageMetadataForPathInput): Promise<void> {
        try {
            const metadata = await readImageMetadata(absolutePath);
            await this.imageRepository.upsertImageMeta(
                imageId,
                toStoredImageMetaInput(metadata),
            );
            const stats = await this.readStatIfExists(absolutePath);
            if (stats) {
                this.promptCache.set(imageId, {
                    mtimeMs: stats.mtimeMs,
                    prompt: buildLegacyPromptText(metadata),
                    metadata,
                });
            }
        } catch (error: unknown) {
            this.warn(
                `[live-images] metadata upsert skipped imageId=${imageId}: ${errorMessage(error)}`,
            );
        }
    }
}
