import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crpyto from 'crypto';

import { models } from '~/models';
import {
    resolveCreatedAtEpochToken,
    resolveDatePathSegments,
} from '~/modules/live-images.time-format';
import { readImageMetadataFromBuffer } from '~/modules/prompt-reader';
import { resolveGeneratedAt } from '~/modules/live-images.utils';
import { Controller } from '~/types';

const imageDir = path.resolve('./public/assets/images');
const DATA_URL_REGEX = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/;

function normalizeExtension(input: string): string {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'jpeg') {
        return 'jpg';
    }
    return normalized;
}

function makePath(dirs: string[]) {
    let currentPath = '';
    for (const dir of dirs) {
        currentPath = path.resolve(currentPath, dir);
        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
        }
    }
}

function parseDataUrlImage(
    input: unknown,
): { extension: string; buffer: Buffer; base64: string } | null {
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

export const uploadImage: Controller = async (req, res) => {
    const parsed = parseDataUrlImage(req.body?.image);
    if (!parsed) {
        res.status(400).json({ error: 'No image uploaded' }).end();
        return;
    }

    const hash = crpyto
        .createHash('sha512')
        .update(parsed.base64)
        .digest('hex');
    const exists = await models.image.findUnique({
        where: {
            hash,
        },
    });

    if (exists) {
        res.status(200)
            .json({
                id: exists.id,
                url: exists.url,
                width: exists.width,
                height: exists.height,
                generatedAt: exists.generatedAt,
            })
            .end();
        return;
    }

    const now = new Date();
    const datePath = resolveDatePathSegments(now);
    const currentPath = [datePath.year, datePath.month, datePath.day];
    makePath(['./public', 'assets', 'images', ...currentPath]);

    const ext = parsed.extension;
    const fileName = `${resolveCreatedAtEpochToken(now)}.${ext}`;
    const buffer = parsed.buffer;

    const sharpImage = sharp(buffer);
    const absoluteFilePath = path.resolve(imageDir, ...currentPath, fileName);

    try {
        await fs.promises.writeFile(absoluteFilePath, buffer);
    } catch (writeError) {
        res.status(500).json({ error: writeError }).end();
        return;
    }

    const metadata = await sharpImage.metadata();
    const url = `/assets/images/${currentPath.join('/')}/${fileName}`;
    const stats = await fs.promises.stat(absoluteFilePath);
    const generatedAt = resolveGeneratedAt(stats);
    const image = await models.image.create({
        data: {
            hash,
            url,
            width: metadata.width || 0,
            height: metadata.height || 0,
            createdAt: generatedAt,
            generatedAt,
        },
    });

    res.status(200)
        .json({
            id: image.id,
            url: image.url,
            width: image.width,
            height: image.height,
            generatedAt: image.generatedAt,
        })
        .end();
};

export const parseImageMetadata: Controller = async (req, res) => {
    const parsed = parseDataUrlImage(req.body?.image);
    if (!parsed) {
        res.status(400)
            .json({
                ok: false,
                message: 'No image uploaded',
            })
            .end();
        return;
    }

    const metadata = await readImageMetadataFromBuffer(parsed.buffer, {
        extension: `.${parsed.extension}`,
    });

    res.status(200)
        .json({
            ok: true,
            metadata,
        })
        .end();
};
