import fs from 'fs';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import sharp from 'sharp';
import { Server as SocketIOServer } from 'socket.io';

import { Image } from '~/models';
import { logger } from './logger';
import { ParsedImageMeta, readImageMetadata } from './prompt-reader';
import { LiveImagesConfigRepository } from './live-images.config-repository';
import { errorMessage, hasErrorCode } from './live-images.errors';
import { LiveImagesImageRepository } from './live-images.image-repository';
import {
    DEFAULT_LIMIT,
    IngestMode,
    ListParams,
    ListPayload,
    LiveImagesStatus,
    LiveSyncConfig,
    PromptCacheItem,
    RegisterLibraryFileOptions,
    StoredImageMetaInput,
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
    sanitizeLimit,
    sanitizePage,
} from './live-images.utils';

const IMAGE_META_RAW_JSON_LIMIT = 64_000;

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
    private startupSyncPromise: Promise<void> | null = null;

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
        this.config = await this.configRepository.readConfig(this.defaultWatchDir);
        this.watchDirPath = this.config.watchDir;
        this.ingestMode = this.config.ingestMode;

        await this.applyWatcherConfig('startup-config');
        this.registerSocketHandlers();
        this.initialized = true;
        this.startStartupSyncInBackground();

        logger.info(
            `[live-images] ready watchDir="${this.watchDirPath}" libraryDir="${this.imageBaseDirPath}" mode="${this.ingestMode}" enabled="${this.config.enabled}"`
        );
    }

    async close(): Promise<void> {
        this.shuttingDown = true;

        if (this.emitTimer) {
            clearTimeout(this.emitTimer);
            this.emitTimer = null;
        }

        if (this.startupSyncPromise) {
            await this.startupSyncPromise;
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
        this.config = await this.configRepository.readConfig(this.defaultWatchDir);
        this.watchDirPath = this.config.watchDir;
        this.ingestMode = this.config.ingestMode;
        return this.config;
    }

    async updateConfig(input: UpdateLiveSyncConfigInput): Promise<LiveSyncConfig> {
        const nextConfig: LiveSyncConfig = {
            watchDir:
                typeof input.watchDir === 'string' && input.watchDir.trim()
                    ? path.resolve(input.watchDir.trim())
                    : this.config.watchDir,
            ingestMode: normalizeIngestMode(input.ingestMode || this.config.ingestMode),
            deleteSourceOnDelete:
                typeof input.deleteSourceOnDelete === 'boolean'
                    ? input.deleteSourceOnDelete
                    : this.config.deleteSourceOnDelete,
            enabled:
                typeof input.enabled === 'boolean' ? input.enabled : this.config.enabled,
            updatedAt: Date.now(),
        };

        await this.configRepository.writeConfig(nextConfig);
        this.config = await this.configRepository.readConfig(this.defaultWatchDir);
        this.watchDirPath = this.config.watchDir;
        this.ingestMode = this.config.ingestMode;
        await this.applyWatcherConfig('config:update');
        this.queueEmit('config:update');
        return this.config;
    }

    async listImages(rawParams: Partial<ListParams> = {}): Promise<ListPayload> {
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

            const linkedSourcePath = await this.imageRepository.readSourceLink(imageId);
            await this.deleteImageRecord(imageId);

            const absolutePath = this.absolutePathFromImageUrl(image.url);
            if (absolutePath) {
                await this.unlinkIfExists(absolutePath);
            }

            if (this.config.deleteSourceOnDelete && linkedSourcePath && this.ingestMode === 'copy') {
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

    async getPrompt(imageId: number): Promise<{ image: Image | null; prompt: string }> {
        const { image, metadata } = await this.getMetadata(imageId);
        if (!image) {
            return { image: null, prompt: '' };
        }
        return {
            image,
            prompt: this.buildLegacyPromptText(metadata),
        };
    }

    async getMetadata(imageId: number): Promise<{ image: Image | null; metadata: ParsedImageMeta }> {
        const image = await this.imageRepository.findImageById(imageId);
        if (!image) {
            return { image: null, metadata: this.createEmptyMetadata() };
        }

        const absolutePath = this.absolutePathFromImageUrl(image.url);
        if (!absolutePath) {
            const stored = await this.imageRepository.readImageMeta(image.id);
            return {
                image,
                metadata: stored ? this.toParsedMetadata(stored) : this.createEmptyMetadata(),
            };
        }

        const stats = await this.readStatIfExists(absolutePath);
        if (!stats) {
            const stored = await this.imageRepository.readImageMeta(image.id);
            return {
                image,
                metadata: stored ? this.toParsedMetadata(stored) : this.createEmptyMetadata(),
            };
        }

        const cached = this.promptCache.get(image.id);
        if (cached && cached.mtimeMs === stats.mtimeMs && cached.metadata) {
            return { image, metadata: cached.metadata };
        }

        const metadata = await readImageMetadata(absolutePath);
        this.promptCache.set(image.id, {
            mtimeMs: stats.mtimeMs,
            prompt: this.buildLegacyPromptText(metadata),
            metadata,
        });

        await this.imageRepository.upsertImageMeta(image.id, this.toStoredImageMetaInput(metadata));
        return { image, metadata };
    }

    async syncNow(reason = 'api:sync'): Promise<{ scanned: number }> {
        const scanned = await this.syncLibraryDirectory(reason);
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
                const payload = await this.listImages({ page: 1, limit: DEFAULT_LIMIT });
                socket.emit('live:images', {
                    reason: 'socket:connected',
                    updatedAt: Date.now(),
                    ...payload,
                });
            } catch (error: unknown) {
                logger.error(`[live-images] failed to send initial payload: ${errorMessage(error)}`);
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

    private startStartupSyncInBackground(): void {
        if (this.startupSyncPromise) {
            return;
        }

        this.startupSyncPromise = (async () => {
            const startedAt = Date.now();
            logger.info('[live-images] startup sync started');
            try {
                const scanned = await this.syncLibraryDirectory('startup-sync');
                logger.info(
                    `[live-images] startup sync completed scanned=${scanned} elapsedMs=${Date.now() - startedAt}`
                );
            } catch (error: unknown) {
                logger.error(`[live-images] startup sync failed: ${errorMessage(error)}`);
            } finally {
                this.startupSyncPromise = null;
            }
        })();
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
                return this.isIgnoredSourcePath(resolved);
            },
        });

        this.sourceWatcher.on('add', (targetPath: string) => {
            void this.ingestSourceFile(path.resolve(targetPath), 'watch:add');
        });

        this.sourceWatcher.on('change', (targetPath: string) => {
            void this.ingestSourceFile(path.resolve(targetPath), 'watch:change');
        });

        this.sourceWatcher.on('error', (error: unknown) => {
            logger.error(`[live-images] source watcher error: ${errorMessage(error)}`);
        });

        this.libraryWatcher = chokidar.watch(this.imageBaseDirPath, {
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 90,
            },
        });

        this.libraryWatcher.on('unlink', (targetPath: string) => {
            void this.removeByLibraryPath(path.resolve(targetPath), 'library:unlink');
        });

        this.libraryWatcher.on('error', (error: unknown) => {
            logger.error(`[live-images] library watcher error: ${errorMessage(error)}`);
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
            const payload = await this.listImages({ page: 1, limit: DEFAULT_LIMIT });
            this.io.emit('live:images', {
                reason,
                updatedAt: Date.now(),
                ...payload,
            });
        } catch (error: unknown) {
            logger.error(`[live-images] emit update failed: ${errorMessage(error)}`);
        }
    }

    private async ingestSourceFile(sourcePath: string, reason: string): Promise<void> {
        if (this.isIgnoredSourcePath(sourcePath)) {
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
                const destinationPath = await createDestinationPath(this.imageBaseDirPath, createdAt, extension);

                if (this.ingestMode === 'move') {
                    await moveFile(sourcePath, destinationPath);
                } else {
                    await fs.promises.copyFile(sourcePath, destinationPath);
                }

                await this.registerLibraryFile(destinationPath, {
                    knownHash: hash,
                    preferredDate: createdAt,
                    sourcePath: this.ingestMode === 'copy' ? sourcePath : undefined,
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
            logger.error(`[live-images] failed to ingest source "${sourcePath}": ${errorMessage(error)}`);
        } finally {
            this.sourceProcessing.delete(sourcePath);
        }
    }

    private async removeByLibraryPath(targetPath: string, reason: string): Promise<void> {
        const removed = await this.enqueueImageMutation(async () => {
            if (this.isIgnoredLibraryPath(targetPath)) {
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

    private isIgnoredSourcePath(targetPath: string): boolean {
        const resolved = path.resolve(targetPath);
        if (
            resolved === this.imageBaseDirPath
            || resolved.startsWith(`${this.imageBaseDirPath}${path.sep}`)
        ) {
            return true;
        }

        const segments = resolved
            .split(/[/\\]+/)
            .map((segment) => segment.trim().toLowerCase())
            .filter(Boolean);

        if (segments.includes('node_modules') || segments.includes('.git')) {
            return true;
        }

        return false;
    }

    private isIgnoredLibraryPath(targetPath: string): boolean {
        const fileName = path.basename(targetPath).toLowerCase();
        return fileName.endsWith('.preview.jpg');
    }

    private async walkLibraryImageFiles(): Promise<string[]> {
        const stack = [this.imageBaseDirPath];
        const result: string[] = [];

        while (stack.length > 0) {
            const currentPath = stack.pop();
            if (!currentPath) {
                continue;
            }

            const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const absolutePath = path.resolve(currentPath, entry.name);
                if (entry.isDirectory()) {
                    stack.push(absolutePath);
                    continue;
                }

                if (!entry.isFile()) {
                    continue;
                }

                if (!isImageFileName(entry.name) || this.isIgnoredLibraryPath(absolutePath)) {
                    continue;
                }

                result.push(absolutePath);
            }
        }

        return result;
    }

    private async syncLibraryDirectory(reason: string): Promise<number> {
        return this.enqueueImageMutation(async () => {
            const entries = await this.walkLibraryImageFiles();
            let scanned = 0;

            for (const absolutePath of entries) {
                try {
                    await this.registerLibraryFile(absolutePath);
                    scanned += 1;
                } catch (error: unknown) {
                    if (hasErrorCode(error, 'ENOENT')) {
                        continue;
                    }
                    logger.error(`[live-images] sync register failed "${absolutePath}": ${errorMessage(error)}`);
                }
            }

            const images = await this.imageRepository.findAllImageRefs();
            for (const image of images) {
                const absolutePath = this.absolutePathFromImageUrl(image.url);
                if (!absolutePath) {
                    continue;
                }

                const stat = await this.readStatIfExists(absolutePath);
                if (!stat) {
                    await this.deleteImageRecord(image.id);
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
            () => undefined
        );
        return run;
    }

    private async registerLibraryFile(
        absolutePath: string,
        options: RegisterLibraryFileOptions = {}
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
        const createdAt = options.preferredDate || (await deriveCreatedAt(absolutePath, stats));
        const fileCreatedAt = this.resolveFileCreatedAt(stats, createdAt);
        const fileModifiedAt = new Date(stats.mtime.getTime());
        const ensureCollectionForExisting = Boolean(options.ensureCollectionForExisting);

        const existingByHash = await this.imageRepository.findImageByHash(hash);
        if (existingByHash) {
            let promptSourcePath = absolutePath;
            if (existingByHash.url !== url) {
                await this.unlinkIfExists(absolutePath);
                const existingPath = this.absolutePathFromImageUrl(existingByHash.url);
                if (existingPath) {
                    promptSourcePath = existingPath;
                }
            }

            const updated = await this.imageRepository.updateImage(existingByHash.id, {
                width,
                height,
                createdAt,
                fileCreatedAt,
                fileModifiedAt,
            });
            await this.upsertImageMetadataForPath(updated.id, promptSourcePath);
            if (ensureCollectionForExisting) {
                await this.ensureCollectionForImage(updated, promptSourcePath);
            }
            await this.upsertSourceLinkIfNeeded(updated.id, options.sourcePath);
            return updated;
        }

        const existingByUrl = await this.imageRepository.findImageByUrl(url);
        if (existingByUrl) {
            const updated = await this.imageRepository.updateImage(existingByUrl.id, {
                hash,
                width,
                height,
                createdAt,
                fileCreatedAt,
                fileModifiedAt,
            });
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
            fileCreatedAt,
            fileModifiedAt,
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

    private async upsertSourceLinkIfNeeded(imageId: number, sourcePath?: string): Promise<void> {
        if (sourcePath && this.ingestMode === 'copy') {
            await this.imageRepository.upsertSourceLink(imageId, sourcePath);
        }
    }

    private async ensureCollectionForImage(image: Image, absolutePath: string): Promise<void> {
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

    private createEmptyMetadata(): ParsedImageMeta {
        return {
            prompt: '',
            negativePrompt: '',
            sourceType: 'unknown',
            parseWarnings: [],
            parseVersion: '',
        };
    }

    private buildLegacyPromptText(metadata: ParsedImageMeta): string {
        if (!metadata.prompt && !metadata.negativePrompt) {
            return '';
        }

        if (metadata.sourceType === 'comfy_prompt') {
            const sections: string[] = [];
            if (metadata.prompt) {
                sections.push(`Positive Prompt\n${metadata.prompt}`);
            }
            if (metadata.negativePrompt) {
                sections.push(`Negative Prompt\n${metadata.negativePrompt}`);
            }
            return sections.join('\n\n');
        }

        if (!metadata.negativePrompt) {
            return metadata.prompt;
        }
        if (!metadata.prompt) {
            return `Negative prompt: ${metadata.negativePrompt}`;
        }
        return `${metadata.prompt}\nNegative prompt: ${metadata.negativePrompt}`;
    }

    private toStoredImageMetaInput(metadata: ParsedImageMeta): StoredImageMetaInput {
        const parseWarningsJson = JSON.stringify(Array.isArray(metadata.parseWarnings) ? metadata.parseWarnings : []);
        const rawJson = JSON.stringify({
            prompt: metadata.prompt,
            negativePrompt: metadata.negativePrompt,
            sourceType: metadata.sourceType,
            parseWarnings: metadata.parseWarnings,
            parseVersion: metadata.parseVersion,
        });

        return {
            sourceType: metadata.sourceType || 'unknown',
            prompt: metadata.prompt || '',
            negativePrompt: metadata.negativePrompt || '',
            model: metadata.model,
            modelHash: metadata.modelHash,
            baseSampler: metadata.baseSampler,
            baseScheduler: metadata.baseScheduler,
            baseSteps: metadata.baseSteps,
            baseCfgScale: metadata.baseCfgScale,
            baseSeed: metadata.baseSeed,
            upscaleSampler: metadata.upscaleSampler,
            upscaleScheduler: metadata.upscaleScheduler,
            upscaleSteps: metadata.upscaleSteps,
            upscaleCfgScale: metadata.upscaleCfgScale,
            upscaleSeed: metadata.upscaleSeed,
            upscaleFactor: metadata.upscaleFactor,
            upscaler: metadata.upscaler,
            sizeWidth: metadata.sizeWidth,
            sizeHeight: metadata.sizeHeight,
            clipSkip: metadata.clipSkip,
            vae: metadata.vae,
            denoiseStrength: metadata.denoiseStrength,
            createdAtFromMeta: metadata.createdAtFromMeta ? new Date(metadata.createdAtFromMeta) : undefined,
            parseWarningsJson,
            parseVersion: metadata.parseVersion || '',
            rawJson: rawJson.length <= IMAGE_META_RAW_JSON_LIMIT ? rawJson : undefined,
        };
    }

    private toParsedMetadata(stored: {
        sourceType: string;
        prompt: string | null;
        negativePrompt: string | null;
        model: string | null;
        modelHash: string | null;
        baseSampler: string | null;
        baseScheduler: string | null;
        baseSteps: number | null;
        baseCfgScale: number | null;
        baseSeed: string | null;
        upscaleSampler: string | null;
        upscaleScheduler: string | null;
        upscaleSteps: number | null;
        upscaleCfgScale: number | null;
        upscaleSeed: string | null;
        upscaleFactor: number | null;
        upscaler: string | null;
        sizeWidth: number | null;
        sizeHeight: number | null;
        clipSkip: number | null;
        vae: string | null;
        denoiseStrength: number | null;
        createdAtFromMeta: Date | null;
        parseWarningsJson: string;
        parseVersion: string;
    }): ParsedImageMeta {
        let parseWarnings: string[] = [];
        try {
            const parsed = JSON.parse(stored.parseWarningsJson || '[]');
            if (Array.isArray(parsed)) {
                parseWarnings = parsed.filter((item) => typeof item === 'string');
            }
        } catch {
            parseWarnings = [];
        }

        return {
            prompt: stored.prompt || '',
            negativePrompt: stored.negativePrompt || '',
            sourceType: (stored.sourceType as ParsedImageMeta['sourceType']) || 'unknown',
            model: stored.model || undefined,
            modelHash: stored.modelHash || undefined,
            baseSampler: stored.baseSampler || undefined,
            baseScheduler: stored.baseScheduler || undefined,
            baseSteps: stored.baseSteps || undefined,
            baseCfgScale: stored.baseCfgScale || undefined,
            baseSeed: stored.baseSeed || undefined,
            upscaleSampler: stored.upscaleSampler || undefined,
            upscaleScheduler: stored.upscaleScheduler || undefined,
            upscaleSteps: stored.upscaleSteps || undefined,
            upscaleCfgScale: stored.upscaleCfgScale || undefined,
            upscaleSeed: stored.upscaleSeed || undefined,
            upscaleFactor: stored.upscaleFactor || undefined,
            upscaler: stored.upscaler || undefined,
            sizeWidth: stored.sizeWidth || undefined,
            sizeHeight: stored.sizeHeight || undefined,
            clipSkip: stored.clipSkip || undefined,
            vae: stored.vae || undefined,
            denoiseStrength: stored.denoiseStrength || undefined,
            createdAtFromMeta: stored.createdAtFromMeta ? stored.createdAtFromMeta.toISOString() : undefined,
            parseWarnings,
            parseVersion: stored.parseVersion || '',
        };
    }

    private async upsertImageMetadataForPath(imageId: number, absolutePath: string): Promise<void> {
        try {
            const metadata = await readImageMetadata(absolutePath);
            await this.imageRepository.upsertImageMeta(imageId, this.toStoredImageMetaInput(metadata));
            const stats = await this.readStatIfExists(absolutePath);
            if (stats) {
                this.promptCache.set(imageId, {
                    mtimeMs: stats.mtimeMs,
                    prompt: this.buildLegacyPromptText(metadata),
                    metadata,
                });
            }
        } catch (error: unknown) {
            logger.warn(`[live-images] metadata upsert skipped imageId=${imageId}: ${errorMessage(error)}`);
        }
    }

    private async deleteImageRecord(imageId: number): Promise<void> {
        await this.imageRepository.deleteImageAndRelations(imageId);
        this.promptCache.delete(imageId);
    }

    private resolveFileCreatedAt(stats: fs.Stats, fallback: Date): Date {
        const birthTimeMs = stats.birthtime?.getTime?.() || 0;
        if (Number.isFinite(birthTimeMs) && birthTimeMs > 0) {
            return new Date(birthTimeMs);
        }
        return fallback;
    }

    private async readStatIfExists(targetPath: string): Promise<fs.Stats | null> {
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

export default liveImagesService;
