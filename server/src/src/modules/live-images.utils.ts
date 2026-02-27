import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import exifr from 'exifr';

import {
    DEFAULT_LIMIT,
    IngestMode,
    MAX_LIMIT,
    PromptParts,
} from './live-images.types';
import { hasErrorCode } from './live-images.errors';

const IMAGE_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.bmp',
    '.tif',
    '.tiff',
    '.avif',
    '.heic',
    '.heif',
    '.jfif',
]);

const EXIF_DATE_FIELDS = [
    'DateTimeOriginal',
    'CreateDate',
    'DateTimeDigitized',
    'DateTime',
    'ModifyDate',
] as const;

type ExifDateField = (typeof EXIF_DATE_FIELDS)[number];
type ExifDateMetadata = Partial<Record<ExifDateField, unknown>>;

export function isImageFileName(fileName: string): boolean {
    return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function normalizeIngestMode(input: unknown): IngestMode {
    if (typeof input === 'string' && input.toLowerCase() === 'move') {
        return 'move';
    }
    return 'copy';
}

export function sanitizeLimit(value: unknown, fallback = DEFAULT_LIMIT): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

export function sanitizePage(value: unknown, fallback = 1): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.max(Math.trunc(parsed), 1);
}

function toPosixPath(targetPath: string): string {
    return targetPath.split(path.sep).join('/');
}

function isPathInside(parentPath: string, childPath: string): boolean {
    const relative = path.relative(parentPath, childPath);
    return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function toValidDate(input: unknown): Date | null {
    const date = input instanceof Date ? input : new Date(String(input));
    if (!Number.isFinite(date.getTime())) {
        return null;
    }
    return date;
}

export async function hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha512');
        const stream = fs.createReadStream(filePath);

        stream.on('error', reject);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

export async function moveFile(fromPath: string, toPath: string): Promise<void> {
    try {
        await fs.promises.rename(fromPath, toPath);
    } catch (error: unknown) {
        if (!hasErrorCode(error, 'EXDEV')) {
            throw error;
        }

        await fs.promises.copyFile(fromPath, toPath);
        await fs.promises.unlink(fromPath);
    }
}

export async function deriveCreatedAt(filePath: string, stats: fs.Stats): Promise<Date> {
    try {
        const metadata = await exifr.parse(filePath, {
            pick: [...EXIF_DATE_FIELDS],
        }) as ExifDateMetadata | null;

        if (metadata) {
            for (const field of EXIF_DATE_FIELDS) {
                const date = toValidDate(metadata[field]);
                if (date) {
                    return date;
                }
            }
        }
    } catch {
        // noop
    }

    const birthTimeMs = stats.birthtime?.getTime?.() || 0;
    if (Number.isFinite(birthTimeMs) && birthTimeMs > 0) {
        return new Date(birthTimeMs);
    }
    return new Date(stats.mtime.getTime());
}

export function decodeFileNameFromUrl(url: string): string {
    try {
        return decodeURIComponent(path.basename(url));
    } catch {
        return path.basename(url);
    }
}

export function extractPromptParts(rawPromptText: string): PromptParts {
    const text = (rawPromptText || '').trim();
    if (!text) {
        return {
            prompt: '',
            negativePrompt: '',
        };
    }

    const comfyPositiveStart = text.indexOf('Positive Prompt');
    const comfyNegativeStart = text.indexOf('Negative Prompt');
    if (comfyPositiveStart >= 0 || comfyNegativeStart >= 0) {
        const positiveText =
            comfyPositiveStart >= 0 && comfyNegativeStart > comfyPositiveStart
                ? text.slice(comfyPositiveStart + 'Positive Prompt'.length, comfyNegativeStart).trim()
                : comfyPositiveStart >= 0
                    ? text.slice(comfyPositiveStart + 'Positive Prompt'.length).trim()
                    : '';
        const negativeText =
            comfyNegativeStart >= 0
                ? text.slice(comfyNegativeStart + 'Negative Prompt'.length).trim()
                : '';

        return {
            prompt: positiveText,
            negativePrompt: negativeText,
        };
    }

    const negativePromptMatch = text.match(/[\r\n]Negative prompt:\s*/i);
    if (negativePromptMatch && typeof negativePromptMatch.index === 'number') {
        const promptText = text.slice(0, negativePromptMatch.index).trim();
        const afterNegativeLabel = text.slice(
            negativePromptMatch.index + negativePromptMatch[0].length
        );
        const stepsMatch = afterNegativeLabel.match(/[\r\n]Steps:\s*/i);
        const negativePromptText = stepsMatch
            ? afterNegativeLabel.slice(0, stepsMatch.index || 0).trim()
            : afterNegativeLabel.trim();

        return {
            prompt: promptText,
            negativePrompt: negativePromptText,
        };
    }

    return {
        prompt: text,
        negativePrompt: '',
    };
}

export function imageUrlFromAbsolutePath(imageBaseDirPath: string, absolutePath: string): string | null {
    const relative = path.relative(imageBaseDirPath, absolutePath);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }

    const parts = toPosixPath(relative)
        .split('/')
        .filter(Boolean)
        .map((part) => encodeURIComponent(part));

    return `/assets/images/${parts.join('/')}`;
}

export function absolutePathFromImageUrl(imageBaseDirPath: string, url: string): string | null {
    const prefix = '/assets/images/';
    if (!url.startsWith(prefix)) {
        return null;
    }

    const rawPath = url.slice(prefix.length);
    const decodedParts = rawPath
        .split('/')
        .filter(Boolean)
        .map((part) => {
            try {
                return decodeURIComponent(part);
            } catch {
                return part;
            }
        });

    const absolutePath = path.resolve(imageBaseDirPath, ...decodedParts);
    if (absolutePath !== imageBaseDirPath && !isPathInside(imageBaseDirPath, absolutePath)) {
        return null;
    }

    return absolutePath;
}

export async function createDestinationPath(
    imageBaseDirPath: string,
    createdAt: Date,
    extensionWithDot: string
): Promise<string> {
    const normalizedExtension = extensionWithDot.startsWith('.')
        ? extensionWithDot.toLowerCase()
        : `.${extensionWithDot.toLowerCase()}`;
    const year = String(createdAt.getFullYear());
    const month = String(createdAt.getMonth() + 1);
    const day = String(createdAt.getDate());
    const dateDirPath = path.resolve(imageBaseDirPath, year, month, day);
    await fs.promises.mkdir(dateDirPath, { recursive: true });

    const baseName = `${createdAt.getTime()}`;

    for (let index = 0; index < Number.MAX_SAFE_INTEGER; index += 1) {
        const suffix = index === 0 ? '' : `_${index}`;
        const fileName = `${baseName}${suffix}${normalizedExtension}`;
        const fullPath = path.resolve(dateDirPath, fileName);

        try {
            await fs.promises.access(fullPath);
            continue;
        } catch {
            return fullPath;
        }
    }

    throw new Error('failed to resolve destination path');
}
