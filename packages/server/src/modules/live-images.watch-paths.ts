import fs from 'fs';
import path from 'path';

import { isImageFileName } from './live-images.utils';

interface IsIgnoredSourcePathInput {
    targetPath: string;
    imageBaseDirPath: string;
}

export function isIgnoredSourcePath({
    targetPath,
    imageBaseDirPath,
}: IsIgnoredSourcePathInput): boolean {
    const resolved = path.resolve(targetPath);
    if (
        resolved === imageBaseDirPath ||
        resolved.startsWith(`${imageBaseDirPath}${path.sep}`)
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

export function isIgnoredLibraryPath(targetPath: string): boolean {
    const fileName = path.basename(targetPath).toLowerCase();
    return fileName.endsWith('.preview.jpg');
}

interface WalkWatchImageFilesInput {
    watchDirPath: string;
    imageBaseDirPath: string;
}

export async function walkWatchImageFiles({
    watchDirPath,
    imageBaseDirPath,
}: WalkWatchImageFilesInput): Promise<string[]> {
    const stack = [watchDirPath];
    const result: string[] = [];

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
                if (
                    isIgnoredSourcePath({
                        targetPath: absolutePath,
                        imageBaseDirPath,
                    })
                ) {
                    continue;
                }
                stack.push(absolutePath);
                continue;
            }

            if (!entry.isFile()) {
                continue;
            }

            if (
                !isImageFileName(entry.name) ||
                isIgnoredSourcePath({
                    targetPath: absolutePath,
                    imageBaseDirPath,
                })
            ) {
                continue;
            }

            result.push(absolutePath);
        }
    }

    return result;
}
