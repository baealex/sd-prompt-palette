import fs from 'fs';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import sharp from 'sharp';
import { Server as SocketIOServer } from 'socket.io';

import { Image } from '~/models';
import { logger } from './logger';
import { readImagePrompt } from './prompt-reader';
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
    PromptParts,
    RegisterLibraryFileOptions,
    UpdateLiveSyncConfigInput,
} from './live-images.types';
import {
    absolutePathFromImageUrl,
    createDestinationPath,
    decodeFileNameFromUrl,
    deriveCreatedAt,
    extractPromptParts,
    hashFile,
    imageUrlFromAbsolutePath,
    isImageFileName,
    moveFile,
    normalizeIngestMode,
    sanitizeLimit,
    sanitizePage,
} from './live-images.utils';

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

        await this.syncLibraryDirectory('startup-sync');
        await this.applyWatcherConfig('startup-config');
        this.registerSocketHandlers();
        this.initialized = true;

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

        this.queueEmit('api:delete');
        return image;
    }

    notifyCollectionsChanged(reason = 'collection:sync'): void {
        this.queueEmit(reason);
    }

    async getPrompt(imageId: number): Promise<{ image: Image | null; prompt: string }> {
        const image = await this.imageRepository.findImageById(imageId);
        if (!image) {
            return { image: null, prompt: '' };
        }

        const absolutePath = this.absolutePathFromImageUrl(image.url);
        if (!absolutePath) {
            return { image, prompt: '' };
        }

        const stats = await this.readStatIfExists(absolutePath);
        if (!stats) {
            return { image, prompt: '' };
        }

        const cached = this.promptCache.get(image.id);
        if (cached && cached.mtimeMs === stats.mtimeMs) {
            return { image, prompt: cached.prompt };
        }

        const prompt = await readImagePrompt(absolutePath);
        this.promptCache.set(image.id, {
            mtimeMs: stats.mtimeMs,
            prompt,
        });
        return { image, prompt };
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
            const stat = await this.readStatIfExists(sourcePath);
            if (!stat || !stat.isFile() || !isImageFileName(sourcePath)) {
                return;
            }

            const fingerprint = `${stat.size}:${stat.mtimeMs}`;
            if (this.sourceFingerprint.get(sourcePath) === fingerprint) {
                return;
            }

            const promptText = (await readImagePrompt(sourcePath)).trim();
            if (!promptText) {
                this.sourceFingerprint.set(sourcePath, fingerprint);
                return;
            }

            const hash = await hashFile(sourcePath);
            const exists = await this.imageRepository.findImageByHash(hash);
            if (exists) {
                this.sourceFingerprint.set(sourcePath, fingerprint);
                return;
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
            this.queueEmit(reason);
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
        if (this.isIgnoredLibraryPath(targetPath)) {
            return;
        }

        const url = this.imageUrlFromAbsolutePath(targetPath);
        if (!url) {
            return;
        }

        const image = await this.imageRepository.findImageByUrl(url);
        if (!image) {
            return;
        }

        await this.deleteImageRecord(image.id);
        this.queueEmit(reason);
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
            });
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
            });
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
        });
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

        let parsedPrompt: PromptParts = {
            prompt: '',
            negativePrompt: '',
        };

        try {
            const rawPrompt = await readImagePrompt(absolutePath);
            parsedPrompt = extractPromptParts(rawPrompt);
        } catch {
            parsedPrompt = {
                prompt: '',
                negativePrompt: '',
            };
        }

        const fileName = path.basename(absolutePath);
        await this.imageRepository.createCollectionForImage({
            imageId: image.id,
            title: fileName,
            prompt: parsedPrompt.prompt,
            negativePrompt: parsedPrompt.negativePrompt,
        });
    }

    private async deleteImageRecord(imageId: number): Promise<void> {
        await this.imageRepository.deleteImageAndRelations(imageId);
        this.promptCache.delete(imageId);
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
