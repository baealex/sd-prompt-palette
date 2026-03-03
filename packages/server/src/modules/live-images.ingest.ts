import fs from 'fs';
import path from 'path';

import { LiveImagesImageRepository } from './live-images.image-repository';
import type { IngestMode, RegisterLibraryFileOptions } from './live-images.types';
import {
    createDestinationPath,
    deriveCreatedAt,
    hashFile,
    moveFile,
} from './live-images.utils';

interface RegisterLibraryFileHandlerInput {
    absolutePath: string;
    options: RegisterLibraryFileOptions;
}

interface IngestSourceToLibraryInput {
    sourcePath: string;
    sourceStats: fs.Stats;
    imageBaseDirPath: string;
    ingestMode: IngestMode;
    imageRepository: LiveImagesImageRepository;
    registerLibraryFile: (
        input: RegisterLibraryFileHandlerInput,
    ) => Promise<void>;
}

interface IngestSourceToLibraryResult {
    changed: boolean;
}

async function unlinkIfExists(targetPath: string): Promise<void> {
    try {
        await fs.promises.unlink(targetPath);
    } catch (error: unknown) {
        if (
            typeof error === 'object' &&
            error &&
            'code' in error &&
            (error as { code?: unknown }).code === 'ENOENT'
        ) {
            return;
        }
        throw error;
    }
}

export async function ingestSourceToLibrary({
    sourcePath,
    sourceStats,
    imageBaseDirPath,
    ingestMode,
    imageRepository,
    registerLibraryFile,
}: IngestSourceToLibraryInput): Promise<IngestSourceToLibraryResult> {
    const hash = await hashFile(sourcePath);
    const existing = await imageRepository.findImageByHash(hash);
    if (existing) {
        return { changed: false };
    }

    const createdAt = await deriveCreatedAt(sourcePath, sourceStats);
    const extension = path.extname(sourcePath).toLowerCase();
    const serverRegisteredAtMs = Date.now();
    const destinationPath = await createDestinationPath({
        imageBaseDirPath,
        createdAt,
        serverRegisteredAtMs,
        contentHash: hash,
        extensionWithDot: extension,
    });

    try {
        if (ingestMode === 'move') {
            await moveFile(sourcePath, destinationPath);
        } else {
            await fs.promises.copyFile(sourcePath, destinationPath);
        }

        await registerLibraryFile({
            absolutePath: destinationPath,
            options: {
                knownHash: hash,
                preferredDate: createdAt,
                sourcePath: ingestMode === 'copy' ? sourcePath : undefined,
                ensureCollectionForExisting: true,
            },
        });
    } catch (error: unknown) {
        if (ingestMode === 'move') {
            try {
                await moveFile(destinationPath, sourcePath);
            } catch {
                // Best effort rollback. Keep destination if source restore fails.
            }
        } else {
            await unlinkIfExists(destinationPath);
        }

        throw error;
    }

    return { changed: true };
}
