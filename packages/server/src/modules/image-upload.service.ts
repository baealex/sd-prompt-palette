import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import sharp from 'sharp';

import {
    resolveCreatedAtEpochToken,
    resolveDatePathSegments,
} from './live-images.time-format';
import { LiveImagesImageRepository } from './live-images.image-repository';
import { resolveGeneratedAt } from './live-images.utils';

const imageRepository = new LiveImagesImageRepository();
const imageBaseDir = path.resolve('./public/assets/images');
const DATA_URL_REGEX = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/;

interface ParsedDataUrlImage {
    extension: string;
    buffer: Buffer;
    base64: string;
}

interface UploadImageResult {
    id: number;
    url: string;
    width: number;
    height: number;
    generatedAt: Date;
}

function normalizeExtension(input: string): string {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'jpeg') {
        return 'jpg';
    }
    return normalized;
}

function ensurePath(pathSegments: string[]): void {
    let currentPath = '';
    for (const segment of pathSegments) {
        currentPath = path.resolve(currentPath, segment);
        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
        }
    }
}

function parseDataUrlImage(input: unknown): ParsedDataUrlImage | null {
    if (typeof input !== 'string') {
        return null;
    }

    const matched = input.match(DATA_URL_REGEX);
    if (!matched) {
        return null;
    }

    const extension = normalizeExtension(matched[1]);
    if (!['png', 'jpg', 'webp'].includes(extension)) {
        return null;
    }

    const base64 = matched[2];
    if (!base64) {
        return null;
    }

    try {
        const buffer = Buffer.from(base64, 'base64');
        if (!buffer.length) {
            return null;
        }
        return { extension, buffer, base64 };
    } catch {
        return null;
    }
}

export function parseUploadDataUrlImage(input: unknown): Buffer | null {
    const parsed = parseDataUrlImage(input);
    if (!parsed) {
        return null;
    }
    return parsed.buffer;
}

export async function uploadImageFromDataUrl(
    input: unknown,
): Promise<UploadImageResult | null> {
    const parsed = parseDataUrlImage(input);
    if (!parsed) {
        return null;
    }

    const hash = crypto.createHash('sha512').update(parsed.base64).digest('hex');
    const existing = await imageRepository.findImageByHash(hash);
    if (existing) {
        return {
            id: existing.id,
            url: existing.url,
            width: existing.width,
            height: existing.height,
            generatedAt: existing.generatedAt,
        };
    }

    const now = new Date();
    const datePath = resolveDatePathSegments(now);
    const dateSegments = [datePath.year, datePath.month, datePath.day];
    ensurePath(['./public', 'assets', 'images', ...dateSegments]);

    const fileName = `${resolveCreatedAtEpochToken(now)}.${parsed.extension}`;
    const absolutePath = path.resolve(imageBaseDir, ...dateSegments, fileName);
    const url = `/assets/images/${dateSegments.join('/')}/${fileName}`;

    await fs.promises.writeFile(absolutePath, parsed.buffer);

    try {
        const metadata = await sharp(parsed.buffer).metadata();
        const stats = await fs.promises.stat(absolutePath);
        const generatedAt = resolveGeneratedAt(stats);

        const image = await imageRepository.createImage({
            hash,
            url,
            width: metadata.width || 0,
            height: metadata.height || 0,
            createdAt: generatedAt,
            generatedAt,
        });

        if (image.url !== url) {
            await unlinkIfExists(absolutePath);
        }

        return {
            id: image.id,
            url: image.url,
            width: image.width,
            height: image.height,
            generatedAt: image.generatedAt,
        };
    } catch (error: unknown) {
        await unlinkIfExists(absolutePath);
        throw error;
    }
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
