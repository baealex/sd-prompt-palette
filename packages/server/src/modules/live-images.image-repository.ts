import { Image, ImageMeta, models } from '~/models';

import { hasErrorCode } from './live-images.errors';
import { StoredImageMetaInput } from './live-images.types';

const IMAGE_META_UPSERT_RETRY_DELAYS_MS = [120, 240, 480] as const;

const RETRYABLE_SQLITE_ERROR_PATTERNS = [
    /operations timed out/i,
    /failed to respond to a query within the configured timeout/i,
    /database is locked/i,
    /database table is locked/i,
    /sqlite_busy/i,
] as const;

const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const isRetryableSqliteWriteError = (error: unknown): boolean => {
    if (hasErrorCode(error, 'P1008') || hasErrorCode(error, 'P2034')) {
        return true;
    }

    if (!(error instanceof Error)) {
        return false;
    }

    return RETRYABLE_SQLITE_ERROR_PATTERNS.some((pattern) =>
        pattern.test(error.message),
    );
};

export class LiveImagesImageRepository {
    async countImages(): Promise<number> {
        return models.image.count();
    }

    async listImages(skip: number, take: number): Promise<Image[]> {
        return models.image.findMany({
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip,
            take,
        });
    }

    async findImageById(imageId: number): Promise<Image | null> {
        return models.image.findUnique({
            where: { id: imageId },
        });
    }

    async findImageByHash(hash: string): Promise<Image | null> {
        return models.image.findUnique({
            where: { hash },
        });
    }

    async findImageByUrl(url: string): Promise<Image | null> {
        return models.image.findUnique({
            where: { url },
        });
    }

    async findAllImageRefs(): Promise<Array<{ id: number; url: string }>> {
        return models.image.findMany({
            select: { id: true, url: true },
        });
    }

    async createImage(data: {
        hash: string;
        url: string;
        width: number;
        height: number;
        createdAt: Date;
        generatedAt: Date;
    }): Promise<Image> {
        try {
            return await models.image.create({
                data,
            });
        } catch (error: unknown) {
            if (!hasErrorCode(error, 'P2002')) {
                throw error;
            }

            const existingByHash = await this.findImageByHash(data.hash);
            if (existingByHash) {
                return existingByHash;
            }

            const existingByUrl = await this.findImageByUrl(data.url);
            if (existingByUrl) {
                return existingByUrl;
            }

            throw error;
        }
    }

    async updateImage(
        imageId: number,
        data: {
            hash?: string;
            width: number;
            height: number;
            createdAt: Date;
            generatedAt: Date;
        },
    ): Promise<Image> {
        return models.image.update({
            where: { id: imageId },
            data,
        });
    }

    async deleteImageAndRelations(imageId: number): Promise<void> {
        await models.collection.deleteMany({
            where: { imageId },
        });

        await models.keyword.updateMany({
            where: { imageId },
            data: { imageId: null },
        });

        await models.liveSyncSourceLink.deleteMany({
            where: { imageId },
        });

        await models.imageMeta.deleteMany({
            where: { imageId },
        });

        await models.image.delete({
            where: { id: imageId },
        });
    }

    async collectionExists(imageId: number): Promise<boolean> {
        const existing = await models.collection.findFirst({
            where: { imageId },
            select: { id: true },
        });
        return Boolean(existing);
    }

    async createCollectionForImage(data: {
        imageId: number;
        title: string;
        prompt: string;
        negativePrompt: string;
    }): Promise<void> {
        await models.collection.create({
            data,
        });
    }

    async readSourceLink(imageId: number): Promise<string | null> {
        const row = await models.liveSyncSourceLink.findUnique({
            where: {
                imageId,
            },
        });
        if (!row || !row.sourcePath) {
            return null;
        }
        return String(row.sourcePath);
    }

    async upsertSourceLink(imageId: number, sourcePath: string): Promise<void> {
        await models.liveSyncSourceLink.upsert({
            where: {
                imageId,
            },
            update: {
                sourcePath,
            },
            create: {
                imageId,
                sourcePath,
            },
        });
    }

    async readImageMeta(imageId: number): Promise<ImageMeta | null> {
        return models.imageMeta.findUnique({
            where: {
                imageId,
            },
        });
    }

    async upsertImageMeta(
        imageId: number,
        data: StoredImageMetaInput,
    ): Promise<void> {
        for (
            let attempt = 0;
            attempt <= IMAGE_META_UPSERT_RETRY_DELAYS_MS.length;
            attempt += 1
        ) {
            try {
                await models.imageMeta.upsert({
                    where: {
                        imageId,
                    },
                    update: data,
                    create: {
                        imageId,
                        ...data,
                    },
                });
                return;
            } catch (error: unknown) {
                const hasRetryRemaining =
                    attempt < IMAGE_META_UPSERT_RETRY_DELAYS_MS.length;
                if (!hasRetryRemaining || !isRetryableSqliteWriteError(error)) {
                    throw error;
                }
                const delayMs = IMAGE_META_UPSERT_RETRY_DELAYS_MS[attempt];
                await sleep(delayMs);
            }
        }
    }
}
