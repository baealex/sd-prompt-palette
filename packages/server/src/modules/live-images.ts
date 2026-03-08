import fs from 'fs';
import path from 'path';
import type { FSWatcher } from 'chokidar';
import { Server as SocketIOServer } from 'socket.io';

import { Image } from '~/models';
import { logger } from './logger';
import { type ParsedImageMeta, readImageMetadata } from './prompt-reader';
import { LiveImagesConfigRepository } from './live-images.config-repository';
import { errorMessage, hasErrorCode } from './live-images.errors';
import { ingestSourceToLibrary } from './live-images.ingest';
import { LiveImagesImageRepository } from './live-images.image-repository';
import { LiveImagesLibraryManager } from './live-images.library-manager';
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
    UpdateLiveSyncConfigInput,
} from './live-images.types';
import {
    decodeFileNameFromUrl,
    isImageFileName,
    normalizeIngestMode,
    sanitizeLimit,
    sanitizePage,
} from './live-images.utils';
import {
    startLiveImagesWatchers,
    stopLiveImagesWatchers,
} from './live-images.watcher-runtime';
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
    private activeSyncRuns = 0;
    private syncReason: string | null = null;
    private syncScanned: number | null = null;
    private syncUpdatedAt = Date.now();

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
    private readonly libraryManager = new LiveImagesLibraryManager({
        imageBaseDirPath: this.imageBaseDirPath,
        imageRepository: this.imageRepository,
        promptCache: this.promptCache,
        getIngestMode: () => this.ingestMode,
        warn: (message) => logger.warn(message),
    });

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
            syncing: this.activeSyncRuns > 0,
            syncReason: this.syncReason,
            syncScanned: this.syncScanned,
            syncUpdatedAt: this.syncUpdatedAt,
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
            await this.libraryManager.deleteImageRecord(imageId);

            const absolutePath = this.libraryManager.absolutePathFromImageUrl(
                image.url,
            );
            if (absolutePath) {
                await this.libraryManager.unlinkIfExists(absolutePath);
            }

            if (
                this.config.deleteSourceOnDelete &&
                linkedSourcePath &&
                this.ingestMode === 'copy'
            ) {
                await this.libraryManager.unlinkIfExists(linkedSourcePath);
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

        const absolutePath = this.libraryManager.absolutePathFromImageUrl(
            image.url,
        );
        if (!absolutePath) {
            const stored = await this.imageRepository.readImageMeta(image.id);
            return {
                image,
                metadata: stored
                    ? toParsedMetadata(stored)
                    : createEmptyParsedMetadata(),
            };
        }

        const stats = await this.libraryManager.readStatIfExists(absolutePath);
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
        this.activeSyncRuns += 1;
        this.syncReason = reason;
        this.syncScanned = null;
        this.syncUpdatedAt = Date.now();
        this.emitStatus(`${reason}:start`);

        try {
            const scanned = await this.syncWatchDirectory(reason);
            this.syncScanned = scanned;
            this.syncUpdatedAt = Date.now();
            return { scanned };
        } finally {
            this.activeSyncRuns = Math.max(0, this.activeSyncRuns - 1);
            if (this.activeSyncRuns === 0) {
                this.syncReason = null;
            }
            this.syncUpdatedAt = Date.now();
            this.emitStatus(`${reason}:end`);
            this.queueEmit(reason);
        }
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
            this.emitStatus(reason);
            return;
        }

        await fs.promises.mkdir(this.watchDirPath, { recursive: true });
        await fs.promises.mkdir(this.imageBaseDirPath, { recursive: true });
        this.startWatchers();
        this.emitStatus(reason);
        this.queueEmit(reason);
    }

    private async stopWatchers(): Promise<void> {
        await stopLiveImagesWatchers({
            sourceWatcher: this.sourceWatcher,
            libraryWatcher: this.libraryWatcher,
        });
        this.sourceWatcher = null;
        this.libraryWatcher = null;
    }

    private startWatchers(): void {
        const watchers = startLiveImagesWatchers({
            watchDirPath: this.watchDirPath,
            imageBaseDirPath: this.imageBaseDirPath,
            onSourceAdd: (absolutePath) => {
                void this.ingestSourceFile({
                    sourcePath: absolutePath,
                    reason: 'watch:add',
                });
            },
            onSourceChange: (absolutePath) => {
                void this.ingestSourceFile({
                    sourcePath: absolutePath,
                    reason: 'watch:change',
                });
            },
            onSourceError: (error: unknown) => {
                logger.error(
                    `[live-images] source watcher error: ${errorMessage(error)}`,
                );
            },
            onLibraryUnlink: (absolutePath) => {
                void this.removeByLibraryPath(absolutePath, 'library:unlink');
            },
            onLibraryError: (error: unknown) => {
                logger.error(
                    `[live-images] library watcher error: ${errorMessage(error)}`,
                );
            },
        });
        this.sourceWatcher = watchers.sourceWatcher;
        this.libraryWatcher = watchers.libraryWatcher;
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

    private emitStatus(reason: string): void {
        if (!this.io) {
            return;
        }

        this.io.emit('live:status', {
            reason,
            ...this.getStatus(),
        });
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

    private async ingestSourceFile({
        sourcePath,
        reason,
        skipQueue = false,
    }: {
        sourcePath: string;
        reason: string;
        skipQueue?: boolean;
    }): Promise<void> {
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
            const run = async () => {
                const stat =
                    await this.libraryManager.readStatIfExists(sourcePath);
                if (!stat || !stat.isFile() || !isImageFileName(sourcePath)) {
                    return false;
                }

                const fingerprint = `${stat.size}:${stat.mtimeMs}`;
                if (this.sourceFingerprint.get(sourcePath) === fingerprint) {
                    return false;
                }

                const ingestResult = await ingestSourceToLibrary({
                    sourcePath,
                    sourceStats: stat,
                    imageBaseDirPath: this.imageBaseDirPath,
                    ingestMode: this.ingestMode,
                    imageRepository: this.imageRepository,
                    registerLibraryFile: async ({ absolutePath, options }) => {
                        await this.libraryManager.registerLibraryFile({
                            absolutePath,
                            options,
                        });
                    },
                });

                this.sourceFingerprint.set(sourcePath, fingerprint);
                return ingestResult.changed;
            };

            const changed = skipQueue
                ? await run()
                : await this.enqueueImageMutation(run);

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

            const url =
                this.libraryManager.imageUrlFromAbsolutePath(targetPath);
            if (!url) {
                return false;
            }

            const image = await this.imageRepository.findImageByUrl(url);
            if (!image) {
                return false;
            }

            await this.libraryManager.deleteImageRecord(image.id);
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
                    await this.ingestSourceFile({
                        sourcePath,
                        reason,
                        skipQueue: true,
                    });
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
}

const liveImagesService = new LiveImagesService();

export { liveImagesService };
