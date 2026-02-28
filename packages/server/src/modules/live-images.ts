import fs from 'fs';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import sharp from 'sharp';
import { Server as SocketIOServer } from 'socket.io';

import { Image } from '~/models';
import { logger } from './logger';
import { type ParsedImageMeta, readImageMetadata } from './prompt-reader';
import { LiveImagesConfigRepository } from './live-images.config-repository';
import { errorMessage, hasErrorCode } from './live-images.errors';
import { LiveImagesImageRepository } from './live-images.image-repository';
import {
    buildLegacyPromptText,
    createEmptyParsedMetadata,
    toParsedMetadata,
    toStoredImageMetaInput,
} from './live-images.metadata';
import {
    DEFAULT_LIMIT,
    IngestMode,
    ListParams,
    ListPayload,
    LiveImagesStatus,
    LiveSyncConfig,
    PromptCacheItem,
    RegisterLibraryFileOptions,
    UpdateLiveSyncConfigInput,
} from './live-images.types';
import {
    absolutePathFromImageUrl,
    createDestinationPath,
    decodeFileNameFromUrl,
    deriveCreatedAt,
    hashFile,
    imageUrlFromAbsolutePath,
    isImageFileName,
    moveFile,
    normalizeIngestMode,
    resolveGeneratedAt,
    sanitizeLimit,
    sanitizePage,
} from './live-images.utils';
import {
    isIgnoredLibraryPath,
    isIgnoredSourcePath,
    walkWatchImageFiles,
} from './live-images.watch-paths';

class LiveImagesService {
    private io: SocketIOServer | null = null;
    private sourceWatcher: FSWatcher | null = null;
    private libraryWatcher: FSWatcher | null = null;
    private initialized = false;
    private shuttingDown = false;
    private sourceProcessing = new Set<string>();
    private sourceFingerprint = new Map<string, string>();
    private promptCache = new Map<number, PromptCacheItem>();
    private emitTimer: NodeJS.Timeout | null = null;
    private pendingEmitReason = 'init';
    private imageMutationQueue: Promise<void> = Promise.resolve();

    private readonly defaultWatchDir = path.resolve('watch');
    private readonly configRepository = new LiveImagesConfigRepository();
    private readonly imageRepository = new LiveImagesImageRepository();
    private config: LiveSyncConfig = {
        watchDir: this.defaultWatchDir,
        ingestMode: 'copy',
        deleteSourceOnDelete: false,
        enabled: false,
        updatedAt: Date.now(),
    };

    private readonly imageBaseDirPath = path.resolve('public/assets/images');
    private watchDirPath = this.config.watchDir;
    private ingestMode: IngestMode = this.config.ingestMode;

    async init(io: SocketIOServer): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.io = io;

        await fs.promises.mkdir(this.imageBaseDirPath, { recursive: true });
        await this.configRepository.ensureLiveSyncTables(this.defaultWatchDir);
        this.config = await this.configRepository.readConfig(
            this.defaultWatchDir,
        );
        this.watchDirPath = this.config.watchDir;
        this.ingestMode = this.config.ingestMode;

        await this.applyWatcherConfig('startup-config');
        this.registerSocketHandlers();
        this.initialized = true;

        logger.info(
            `[live-images] ready watchDir="${this.watchDirPath}" libraryDir="${this.imageBaseDirPath}" mode="${this.ingestMode}" enabled="${this.config.enabled}"`,
        );
    }

    async close(): Promise<void> {
        this.shuttingDown = true;

        if (this.emitTimer) {
            clearTimeout(this.emitTimer);
            this.emitTimer = null;
        }

        await this.stopWatchers();
    }

    getStatus(): LiveImagesStatus {
        return {
            watchDir: this.config.watchDir,
            libraryDir: this.imageBaseDirPath,
            ingestMode: this.config.ingestMode,
            deleteSourceOnDelete: this.config.deleteSourceOnDelete,
            enabled: this.config.enabled,
            watchersRunning: Boolean(this.sourceWatcher && this.libraryWatcher),
            initialized: this.initialized,
            updatedAt: this.config.updatedAt,
        };
    }

    async getConfig(): Promise<LiveSyncConfig> {
        this.config = await this.configRepository.readConfig(
            this.defaultWatchDir,
        );
        this.watchDirPath = this.config.watchDir;
        this.ingestMode = this.config.ingestMode;
        return this.config;
    }

    async updateConfig(
        input: UpdateLiveSyncConfigInput,
    ): Promise<LiveSyncConfig> {
        const nextConfig: LiveSyncConfig = {
            watchDir:
                typeof input.watchDir === 'string' && input.watchDir.trim()
                    ? path.resolve(input.watchDir.trim())
                    : this.config.watchDir,
            ingestMode: normalizeIngestMode(
                input.ingestMode || this.config.ingestMode,
            ),
            deleteSourceOnDelete:
                typeof input.deleteSourceOnDelete === 'boolean'
                    ? input.deleteSourceOnDelete
                    : this.config.deleteSourceOnDelete,
            enabled:
                typeof input.enabled === 'boolean'
                    ? input.enabled
                    : this.config.enabled,
            updatedAt: Date.now(),
        };

        await this.configRepository.writeConfig(nextConfig);
        this.config = await this.configRepository.readConfig(
            this.defaultWatchDir,
        );
        this.watchDirPath = this.config.watchDir;
        this.ingestMode = this.config.ingestMode;
        await this.applyWatcherConfig('config:update');
        this.queueEmit('config:update');
        return this.config;
    }

    async listImages(
        rawParams: Partial<ListParams> = {},
    ): Promise<ListPayload> {
        const page = sanitizePage(rawParams.page, 1);
        const limit = sanitizeLimit(rawParams.limit, DEFAULT_LIMIT);
        const skip = (page - 1) * limit;

        const [total, items] = await Promise.all([
            this.imageRepository.countImages(),
            this.imageRepository.listImages(skip, limit),
        ]);

        return {
            page,
            limit,
            total,
            hasMore: skip + items.length < total,
            images: items.map((item) => ({
                id: item.id,
                name: decodeFileNameFromUrl(item.url),
                url: item.url,
                width: item.width,
                height: item.height,
                createdAt: item.createdAt.getTime(),
            })),
        };
    }

    async deleteImage(imageId: number): Promise<Image | null> {
        const deleted = await this.enqueueImageMutation(async () => {
            const image = await this.imageRepository.findImageById(imageId);
            if (!image) {
                return null;
            }

            const linkedSourcePath =
                await this.imageRepository.readSourceLink(imageId);
            await this.deleteImageRecord(imageId);

            const absolutePath = this.absolutePathFromImageUrl(image.url);
            if (absolutePath) {
                await this.unlinkIfExists(absolutePath);
            }

            if (
                this.config.deleteSourceOnDelete &&
                linkedSourcePath &&
                this.ingestMode === 'copy'
            ) {
                await this.unlinkIfExists(linkedSourcePath);
            }

            return image;
        });

        if (deleted) {
            this.queueEmit('api:delete');
        }

        return deleted;
    }

    notifyCollectionsChanged(reason = 'collection:sync'): void {
        this.queueEmit(reason);
    }

    async getPrompt(
        imageId: number,
    ): Promise<{ image: Image | null; prompt: string }> {
        const { image, metadata } = await this.getMetadata(imageId);
        if (!image) {
            return { image: null, prompt: '' };
        }
        return {
            image,
            prompt: buildLegacyPromptText(metadata),
        };
    }

    async getMetadata(
        imageId: number,
    ): Promise<{ image: Image | null; metadata: ParsedImageMeta }> {
        const image = await this.imageRepository.findImageById(imageId);
        if (!image) {
            return { image: null, metadata: createEmptyParsedMetadata() };
        }

        const absolutePath = this.absolutePathFromImageUrl(image.url);
        if (!absolutePath) {
            const stored = await this.imageRepository.readImageMeta(image.id);
            return {
                image,
                metadata: stored
                    ? toParsedMetadata(stored)
                    : createEmptyParsedMetadata(),
            };
        }

        const stats = await this.readStatIfExists(absolutePath);
        if (!stats) {
            const stored = await this.imageRepository.readImageMeta(image.id);
            return {
                image,
                metadata: stored
                    ? toParsedMetadata(stored)
                    : createEmptyParsedMetadata(),
            };
        }

        const cached = this.promptCache.get(image.id);
        if (cached && cached.mtimeMs === stats.mtimeMs && cached.metadata) {
            return { image, metadata: cached.metadata };
        }

        const metadata = await readImageMetadata(absolutePath);
        this.promptCache.set(image.id, {
            mtimeMs: stats.mtimeMs,
            prompt: buildLegacyPromptText(metadata),
            metadata,
        });

        await this.imageRepository.upsertImageMeta(
            image.id,
            toStoredImageMetaInput(metadata),
        );
        return { image, metadata };
    }

    async syncNow(reason = 'api:sync'): Promise<{ scanned: number }> {
        const scanned = await this.syncWatchDirectory(reason);
        this.queueEmit(reason);
        return { scanned };
    }

    private registerSocketHandlers(): void {
        if (!this.io) {
            return;
        }

        this.io.on('connection', async (socket) => {
            socket.emit('live:status', this.getStatus());
            try {
                const payload = await this.listImages({
                    page: 1,
                    limit: DEFAULT_LIMIT,
                });
                socket.emit('live:images', {
                    reason: 'socket:connected',
                    updatedAt: Date.now(),
                    ...payload,
                });
            } catch (error: unknown) {
                logger.error(
                    `[live-images] failed to send initial payload: ${errorMessage(error)}`,
                );
            }
        });
    }

    private async applyWatcherConfig(reason: string): Promise<void> {
        await this.stopWatchers();

        if (!this.config.enabled) {
            return;
        }

        await fs.promises.mkdir(this.watchDirPath, { recursive: true });
        await fs.promises.mkdir(this.imageBaseDirPath, { recursive: true });
        this.startWatchers();
        this.queueEmit(reason);
    }

    private async stopWatchers(): Promise<void> {
        await Promise.all([
            this.sourceWatcher?.close(),
            this.libraryWatcher?.close(),
        ]);
        this.sourceWatcher = null;
        this.libraryWatcher = null;
    }

    private startWatchers(): void {
        this.sourceWatcher = chokidar.watch(this.watchDirPath, {
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 450,
                pollInterval: 110,
            },
            ignored: (targetPath: string) => {
                const resolved = path.resolve(targetPath);
                return isIgnoredSourcePath({
                    targetPath: resolved,
                    imageBaseDirPath: this.imageBaseDirPath,
                });
            },
        });

        this.sourceWatcher.on('add', (targetPath: string) => {
            void this.ingestSourceFile(path.resolve(targetPath), 'watch:add');
        });

        this.sourceWatcher.on('change', (targetPath: string) => {
            void this.ingestSourceFile(
                path.resolve(targetPath),
                'watch:change',
            );
        });

        this.sourceWatcher.on('error', (error: unknown) => {
            logger.error(
                `[live-images] source watcher error: ${errorMessage(error)}`,
            );
        });

        this.libraryWatcher = chokidar.watch(this.imageBaseDirPath, {
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 90,
            },
        });

        this.libraryWatcher.on('unlink', (targetPath: string) => {
            void this.removeByLibraryPath(
                path.resolve(targetPath),
                'library:unlink',
            );
        });

        this.libraryWatcher.on('error', (error: unknown) => {
            logger.error(
                `[live-images] library watcher error: ${errorMessage(error)}`,
            );
        });
    }

    private queueEmit(reason: string): void {
        if (this.shuttingDown) {
            return;
        }

        this.pendingEmitReason = reason;
        if (this.emitTimer) {
            clearTimeout(this.emitTimer);
        }

        this.emitTimer = setTimeout(() => {
            this.emitTimer = null;
            void this.emitImagesUpdate(this.pendingEmitReason);
        }, 180);
    }

    private async emitImagesUpdate(reason: string): Promise<void> {
        if (!this.io) {
            return;
        }

        try {
            const payload = await this.listImages({
                page: 1,
                limit: DEFAULT_LIMIT,
            });
            this.io.emit('live:images', {
                reason,
                updatedAt: Date.now(),
                ...payload,
            });
        } catch (error: unknown) {
            logger.error(
                `[live-images] emit update failed: ${errorMessage(error)}`,
            );
        }
    }

    private async ingestSourceFile(
        sourcePath: string,
        reason: string,
    ): Promise<void> {
        if (
            isIgnoredSourcePath({
                targetPath: sourcePath,
                imageBaseDirPath: this.imageBaseDirPath,
            })
        ) {
            return;
        }

        if (this.sourceProcessing.has(sourcePath)) {
            return;
        }

        this.sourceProcessing.add(sourcePath);
        try {
            const changed = await this.enqueueImageMutation(async () => {
                const stat = await this.readStatIfExists(sourcePath);
                if (!stat || !stat.isFile() || !isImageFileName(sourcePath)) {
                    return false;
                }

                const fingerprint = `${stat.size}:${stat.mtimeMs}`;
                if (this.sourceFingerprint.get(sourcePath) === fingerprint) {
                    return false;
                }

                const hash = await hashFile(sourcePath);
                const exists = await this.imageRepository.findImageByHash(hash);
                if (exists) {
                    this.sourceFingerprint.set(sourcePath, fingerprint);
                    return false;
                }

                const createdAt = await deriveCreatedAt(sourcePath, stat);
                const extension = path.extname(sourcePath).toLowerCase();
                const serverRegisteredAtMs = Date.now();
                const destinationPath = await createDestinationPath({
                    imageBaseDirPath: this.imageBaseDirPath,
                    createdAt,
                    serverRegisteredAtMs,
                    contentHash: hash,
                    extensionWithDot: extension,
                });

                if (this.ingestMode === 'move') {
                    await moveFile(sourcePath, destinationPath);
                } else {
                    await fs.promises.copyFile(sourcePath, destinationPath);
                }

                await this.registerLibraryFile(destinationPath, {
                    knownHash: hash,
                    preferredDate: createdAt,
                    sourcePath:
                        this.ingestMode === 'copy' ? sourcePath : undefined,
                    ensureCollectionForExisting: true,
                });

                this.sourceFingerprint.set(sourcePath, fingerprint);
                return true;
            });

            if (changed) {
                this.queueEmit(reason);
            }
        } catch (error: unknown) {
            if (hasErrorCode(error, 'ENOENT')) {
                return;
            }
            logger.error(
                `[live-images] failed to ingest source "${sourcePath}": ${errorMessage(error)}`,
            );
        } finally {
            this.sourceProcessing.delete(sourcePath);
        }
    }

    private async removeByLibraryPath(
        targetPath: string,
        reason: string,
    ): Promise<void> {
        const removed = await this.enqueueImageMutation(async () => {
            if (isIgnoredLibraryPath(targetPath)) {
                return false;
            }

            const url = this.imageUrlFromAbsolutePath(targetPath);
            if (!url) {
                return false;
            }

            const image = await this.imageRepository.findImageByUrl(url);
            if (!image) {
                return false;
            }

            await this.deleteImageRecord(image.id);
            return true;
        });

        if (removed) {
            this.queueEmit(reason);
        }
    }

    private async syncWatchDirectory(reason: string): Promise<number> {
        return this.enqueueImageMutation(async () => {
            await fs.promises.mkdir(this.watchDirPath, { recursive: true });
            await fs.promises.mkdir(this.imageBaseDirPath, { recursive: true });

            const entries = await walkWatchImageFiles({
                watchDirPath: this.watchDirPath,
                imageBaseDirPath: this.imageBaseDirPath,
            });
            let scanned = 0;

            for (const sourcePath of entries) {
                try {
                    await this.ingestSourceFile(sourcePath, reason);
                    scanned += 1;
                } catch (error: unknown) {
                    if (hasErrorCode(error, 'ENOENT')) {
                        continue;
                    }
                    logger.error(
                        `[live-images] sync ingest failed "${sourcePath}": ${errorMessage(error)}`,
                    );
                }
            }

            this.queueEmit(reason);
            return scanned;
        });
    }

    private enqueueImageMutation<T>(task: () => Promise<T>): Promise<T> {
        const run = this.imageMutationQueue.then(task, task);
        this.imageMutationQueue = run.then(
            () => undefined,
            () => undefined,
        );
        return run;
    }

    private async registerLibraryFile(
        absolutePath: string,
        options: RegisterLibraryFileOptions = {},
    ): Promise<Image> {
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
            options.preferredDate ||
            (await deriveCreatedAt(absolutePath, stats));
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
            await this.upsertImageMetadataForPath(updated.id, promptSourcePath);
            if (ensureCollectionForExisting) {
                await this.ensureCollectionForImage(updated, promptSourcePath);
            }
            await this.upsertSourceLinkIfNeeded(updated.id, options.sourcePath);
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
            await this.upsertImageMetadataForPath(updated.id, absolutePath);
            if (ensureCollectionForExisting) {
                await this.ensureCollectionForImage(updated, absolutePath);
            }
            await this.upsertSourceLinkIfNeeded(updated.id, options.sourcePath);
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
        await this.upsertImageMetadataForPath(created.id, absolutePath);
        await this.ensureCollectionForImage(created, absolutePath);
        await this.upsertSourceLinkIfNeeded(created.id, options.sourcePath);
        return created;
    }

    private imageUrlFromAbsolutePath(absolutePath: string): string | null {
        return imageUrlFromAbsolutePath(this.imageBaseDirPath, absolutePath);
    }

    private absolutePathFromImageUrl(url: string): string | null {
        return absolutePathFromImageUrl(this.imageBaseDirPath, url);
    }

    private async upsertSourceLinkIfNeeded(
        imageId: number,
        sourcePath?: string,
    ): Promise<void> {
        if (sourcePath && this.ingestMode === 'copy') {
            await this.imageRepository.upsertSourceLink(imageId, sourcePath);
        }
    }

    private async ensureCollectionForImage(
        image: Image,
        absolutePath: string,
    ): Promise<void> {
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

    private async upsertImageMetadataForPath(
        imageId: number,
        absolutePath: string,
    ): Promise<void> {
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
            logger.warn(
                `[live-images] metadata upsert skipped imageId=${imageId}: ${errorMessage(error)}`,
            );
        }
    }

    private async deleteImageRecord(imageId: number): Promise<void> {
        await this.imageRepository.deleteImageAndRelations(imageId);
        this.promptCache.delete(imageId);
    }

    private async readStatIfExists(
        targetPath: string,
    ): Promise<fs.Stats | null> {
        try {
            return await fs.promises.stat(targetPath);
        } catch (error: unknown) {
            if (hasErrorCode(error, 'ENOENT')) {
                return null;
            }
            throw error;
        }
    }

    private async unlinkIfExists(targetPath: string): Promise<void> {
        try {
            await fs.promises.unlink(targetPath);
        } catch (error: unknown) {
            if (!hasErrorCode(error, 'ENOENT')) {
                throw error;
            }
        }
    }
}

const liveImagesService = new LiveImagesService();

export { liveImagesService };
