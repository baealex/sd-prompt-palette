import fs from 'fs';
import os from 'os';
import path from 'path';

import { LiveImagesImageRepository } from './live-images.image-repository';
import { ingestSourceToLibrary } from './live-images.ingest';

interface MockImageRepository {
    findImageByHash: jest.Mock;
}

async function collectFiles(rootPath: string): Promise<string[]> {
    const files: string[] = [];
    const stack = [rootPath];

    while (stack.length > 0) {
        const currentPath = stack.pop();
        if (!currentPath) {
            continue;
        }

        const entries = await fs.promises.readdir(currentPath, {
            withFileTypes: true,
        });
        for (const entry of entries) {
            const absolutePath = path.resolve(currentPath, entry.name);
            if (entry.isDirectory()) {
                stack.push(absolutePath);
                continue;
            }
            if (entry.isFile()) {
                files.push(absolutePath);
            }
        }
    }

    return files;
}

describe('ingestSourceToLibrary rollback', () => {
    let tempDirPath = '';
    let watchDirPath = '';
    let libraryDirPath = '';
    let sourcePath = '';

    beforeEach(async () => {
        tempDirPath = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'ocean-palette-ingest-'),
        );
        watchDirPath = path.resolve(tempDirPath, 'watch');
        libraryDirPath = path.resolve(tempDirPath, 'library');
        sourcePath = path.resolve(watchDirPath, 'input.png');

        await fs.promises.mkdir(watchDirPath, { recursive: true });
        await fs.promises.mkdir(libraryDirPath, { recursive: true });
        await fs.promises.writeFile(sourcePath, Buffer.from('png-data'));
    });

    afterEach(async () => {
        await fs.promises.rm(tempDirPath, { recursive: true, force: true });
    });

    it('cleans copied destination file when library registration fails', async () => {
        const imageRepository: MockImageRepository = {
            findImageByHash: jest.fn().mockResolvedValue(null),
        };

        const sourceStats = await fs.promises.stat(sourcePath);

        await expect(
            ingestSourceToLibrary({
                sourcePath,
                sourceStats,
                imageBaseDirPath: libraryDirPath,
                ingestMode: 'copy',
                imageRepository:
                    imageRepository as unknown as LiveImagesImageRepository,
                registerLibraryFile: async () => {
                    throw new Error('register failed');
                },
            }),
        ).rejects.toThrow('register failed');

        const [sourceExists, libraryFiles] = await Promise.all([
            fs.promises
                .access(sourcePath)
                .then(() => true)
                .catch(() => false),
            collectFiles(libraryDirPath),
        ]);

        expect(sourceExists).toBe(true);
        expect(libraryFiles).toHaveLength(0);
    });

    it('restores source file in move mode when library registration fails', async () => {
        const imageRepository: MockImageRepository = {
            findImageByHash: jest.fn().mockResolvedValue(null),
        };

        const sourceStats = await fs.promises.stat(sourcePath);

        await expect(
            ingestSourceToLibrary({
                sourcePath,
                sourceStats,
                imageBaseDirPath: libraryDirPath,
                ingestMode: 'move',
                imageRepository:
                    imageRepository as unknown as LiveImagesImageRepository,
                registerLibraryFile: async () => {
                    throw new Error('register failed');
                },
            }),
        ).rejects.toThrow('register failed');

        const [sourceExists, libraryFiles] = await Promise.all([
            fs.promises
                .access(sourcePath)
                .then(() => true)
                .catch(() => false),
            collectFiles(libraryDirPath),
        ]);

        expect(sourceExists).toBe(true);
        expect(libraryFiles).toHaveLength(0);
    });
});
