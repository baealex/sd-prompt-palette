import fs from 'fs';
import path from 'path';

import liveImagesService from '~/modules/live-images';
import { errorMessage, hasErrorCode } from '~/modules/live-images.errors';
import { Controller } from '~/types';

interface DirectoryEntry {
    name: string;
    path: string;
}

function parseBoolean(input: unknown): boolean | undefined {
    if (typeof input === 'boolean') {
        return input;
    }

    if (typeof input === 'string') {
        const normalized = input.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
            return true;
        }
        if (normalized === 'false' || normalized === '0') {
            return false;
        }
    }

    if (typeof input === 'number') {
        if (input === 1) {
            return true;
        }
        if (input === 0) {
            return false;
        }
    }

    return undefined;
}

function parseId(input: unknown): number | null {
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return Math.trunc(parsed);
}

function parsePathQuery(input: unknown): string | undefined {
    if (typeof input === 'string' && input.trim()) {
        return input.trim();
    }

    if (Array.isArray(input)) {
        for (const value of input) {
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }
    }

    return undefined;
}

function isRootPath(targetPath: string): boolean {
    const resolvedPath = path.resolve(targetPath);
    const rootPath = path.resolve(path.parse(resolvedPath).root || resolvedPath);

    if (process.platform === 'win32') {
        return resolvedPath.toLowerCase() === rootPath.toLowerCase();
    }

    return resolvedPath === rootPath;
}

async function isExistingDirectory(targetPath: string): Promise<boolean> {
    try {
        const stat = await fs.promises.stat(targetPath);
        return stat.isDirectory();
    } catch (error: unknown) {
        if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ENOTDIR')) {
            return false;
        }
        throw error;
    }
}

async function getWindowsRoots(): Promise<string[]> {
    if (process.platform !== 'win32') {
        return [];
    }

    const roots: string[] = [];
    for (let code = 65; code <= 90; code += 1) {
        const drive = `${String.fromCharCode(code)}:\\`;
        if (await isExistingDirectory(drive)) {
            roots.push(path.resolve(drive));
        }
    }
    return roots;
}

async function resolveDirectoryPath(requestedPath?: string): Promise<string> {
    if (requestedPath) {
        return path.resolve(requestedPath);
    }

    const config = await liveImagesService.getConfig();
    const configWatchDir = path.resolve(config.watchDir || path.resolve('watch'));
    if (await isExistingDirectory(configWatchDir)) {
        return configWatchDir;
    }

    const cwd = path.resolve(process.cwd());
    if (await isExistingDirectory(cwd)) {
        return cwd;
    }

    if (process.platform === 'win32') {
        const roots = await getWindowsRoots();
        if (roots.length > 0) {
            return roots[0];
        }
    }

    return path.resolve('watch');
}

async function listDirectories(currentPath: string): Promise<DirectoryEntry[]> {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
            name: entry.name,
            path: path.resolve(currentPath, entry.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export const getLiveConfig: Controller = async (_, res) => {
    const config = await liveImagesService.getConfig();
    res.status(200).json({
        ok: true,
        config,
        status: liveImagesService.getStatus(),
    }).end();
};

export const updateLiveConfig: Controller = async (req, res) => {
    const watchDir = typeof req.body?.watchDir === 'string' ? req.body.watchDir : undefined;
    const ingestMode = req.body?.ingestMode;
    const deleteSourceOnDelete = parseBoolean(req.body?.deleteSourceOnDelete);
    const enabled = parseBoolean(req.body?.enabled);

    const config = await liveImagesService.updateConfig({
        watchDir,
        ingestMode,
        deleteSourceOnDelete,
        enabled,
    });

    res.status(200).json({
        ok: true,
        config,
        status: liveImagesService.getStatus(),
    }).end();
};

export const listLiveDirectories: Controller = async (req, res) => {
    const requestedPath = parsePathQuery(req.query?.path);
    const currentPath = await resolveDirectoryPath(requestedPath);

    let stat: fs.Stats;
    try {
        stat = await fs.promises.stat(currentPath);
    } catch (error: unknown) {
        if (hasErrorCode(error, 'ENOENT')) {
            res.status(404).json({
                ok: false,
                message: 'directory does not exist',
            }).end();
            return;
        }
        throw error;
    }

    if (!stat.isDirectory()) {
        res.status(400).json({
            ok: false,
            message: 'path is not a directory',
        }).end();
        return;
    }

    const directories = await listDirectories(currentPath);
    const parentPath = isRootPath(currentPath) ? null : path.dirname(currentPath);
    const roots = await getWindowsRoots();

    res.status(200).json({
        ok: true,
        currentPath,
        parentPath,
        roots,
        directories,
    }).end();
};

export const pickLiveDirectory: Controller = async (_, res) => {
    res.status(410).json({
        ok: false,
        message: 'Desktop picker is deprecated. Use /api/live/config/directories.',
    }).end();
};

export const liveStatus: Controller = async (_, res) => {
    const config = await liveImagesService.getConfig();
    res.status(200).json({
        ok: true,
        config,
        ...liveImagesService.getStatus(),
    }).end();
};

export const listLiveImages: Controller = async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 60);
    const payload = await liveImagesService.listImages({ page, limit });

    res.status(200).json({
        ok: true,
        updatedAt: Date.now(),
        ...payload,
    }).end();
};

export const getLiveImagePrompt: Controller = async (req, res) => {
    const imageId = parseId(req.params.id);
    if (!imageId) {
        res.status(400).json({
            ok: false,
            message: 'invalid image id',
        }).end();
        return;
    }

    const { image, prompt } = await liveImagesService.getPrompt(imageId);
    if (!image) {
        res.status(404).json({
            ok: false,
            message: 'image not found',
        }).end();
        return;
    }

    res.status(200).json({
        ok: true,
        id: image.id,
        prompt,
    }).end();
};

export const deleteLiveImage: Controller = async (req, res) => {
    const imageId = parseId(req.params.id);
    if (!imageId) {
        res.status(400).json({
            ok: false,
            message: 'invalid image id',
        }).end();
        return;
    }

    const deleted = await liveImagesService.deleteImage(imageId);
    if (!deleted) {
        res.status(404).json({
            ok: false,
            message: 'image not found',
        }).end();
        return;
    }

    res.status(200).json({
        ok: true,
        deleted: {
            id: deleted.id,
            url: deleted.url,
        },
    }).end();
};

export const syncLiveImages: Controller = async (_, res) => {
    try {
        const result = await liveImagesService.syncNow('api:sync');
        res.status(200).json({
            ok: true,
            ...result,
        }).end();
    } catch (error: unknown) {
        res.status(500).json({
            ok: false,
            message: errorMessage(error),
        }).end();
    }
};
