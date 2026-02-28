import chokidar, { type FSWatcher } from 'chokidar';
import path from 'path';

import { isIgnoredSourcePath } from './live-images.watch-paths';

export interface LiveImagesWatcherPair {
    sourceWatcher: FSWatcher;
    libraryWatcher: FSWatcher;
}

interface StartLiveImagesWatchersInput {
    watchDirPath: string;
    imageBaseDirPath: string;
    onSourceAdd: (absolutePath: string) => void;
    onSourceChange: (absolutePath: string) => void;
    onSourceError: (error: unknown) => void;
    onLibraryUnlink: (absolutePath: string) => void;
    onLibraryError: (error: unknown) => void;
}

interface StopLiveImagesWatchersInput {
    sourceWatcher: FSWatcher | null;
    libraryWatcher: FSWatcher | null;
}

export function startLiveImagesWatchers({
    watchDirPath,
    imageBaseDirPath,
    onSourceAdd,
    onSourceChange,
    onSourceError,
    onLibraryUnlink,
    onLibraryError,
}: StartLiveImagesWatchersInput): LiveImagesWatcherPair {
    const sourceWatcher = chokidar.watch(watchDirPath, {
        ignoreInitial: false,
        awaitWriteFinish: {
            stabilityThreshold: 450,
            pollInterval: 110,
        },
        ignored: (targetPath: string) => {
            const resolved = path.resolve(targetPath);
            return isIgnoredSourcePath({
                targetPath: resolved,
                imageBaseDirPath,
            });
        },
    });

    sourceWatcher.on('add', (targetPath: string) => {
        onSourceAdd(path.resolve(targetPath));
    });

    sourceWatcher.on('change', (targetPath: string) => {
        onSourceChange(path.resolve(targetPath));
    });

    sourceWatcher.on('error', onSourceError);

    const libraryWatcher = chokidar.watch(imageBaseDirPath, {
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 90,
        },
    });

    libraryWatcher.on('unlink', (targetPath: string) => {
        onLibraryUnlink(path.resolve(targetPath));
    });

    libraryWatcher.on('error', onLibraryError);

    return {
        sourceWatcher,
        libraryWatcher,
    };
}

export async function stopLiveImagesWatchers({
    sourceWatcher,
    libraryWatcher,
}: StopLiveImagesWatchersInput): Promise<void> {
    await Promise.all([sourceWatcher?.close(), libraryWatcher?.close()]);
}
