import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crpyto from 'crypto';

import { models } from '~/models';
import { readImageMetadataFromBuffer } from '~/modules/prompt-reader';
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
                fileCreatedAt: exists.fileCreatedAt,
                fileModifiedAt: exists.fileModifiedAt,
            })
            .end();
        return;
    }

    const currentPath = [
        new Date().getFullYear().toString(),
        (new Date().getMonth() + 1).toString(),
        new Date().getDate().toString(),
    ];
    makePath(['./public', 'assets', 'images', ...currentPath]);

    const ext = parsed.extension;
    const fileName = `${Date.now()}.${ext}`;
    const buffer = parsed.buffer;

    const sharpImage = sharp(buffer);
    const previewImage = await sharpImage
        .blur(100)
        .jpeg({ quality: 50 })
        .toBuffer();
    const previewFileName = fileName.replace(`.${ext}`, '.preview.jpg');

    fs.writeFile(
        path.resolve(imageDir, ...currentPath, previewFileName),
        previewImage,
        async (previewError) => {
            if (previewError) {
                res.status(500).json({ error: previewError }).end();
                return;
            }
        },
    );

    fs.writeFile(
        path.resolve(imageDir, ...currentPath, fileName),
        buffer,
        async (writeError) => {
            if (writeError) {
                res.status(500).json({ error: writeError }).end();
                return;
            }

            const metadata = await sharpImage.metadata();
            const url = `/assets/images/${currentPath.join('/')}/${fileName}`;
            const absoluteFilePath = path.resolve(
                imageDir,
                ...currentPath,
                fileName,
            );
            const stats = await fs.promises.stat(absoluteFilePath);
            const fileCreatedAt =
                Number.isFinite(stats.birthtime.getTime()) &&
                stats.birthtime.getTime() > 0
                    ? new Date(stats.birthtime.getTime())
                    : new Date(stats.mtime.getTime());
            const fileModifiedAt = new Date(stats.mtime.getTime());
            const image = await models.image.create({
                data: {
                    hash,
                    url,
                    width: metadata.width || 0,
                    height: metadata.height || 0,
                    createdAt: fileCreatedAt,
                    fileCreatedAt,
                    fileModifiedAt,
                },
            });

            res.status(200)
                .json({
                    id: image.id,
                    url: image.url,
                    width: image.width,
                    height: image.height,
                    fileCreatedAt: image.fileCreatedAt,
                    fileModifiedAt: image.fileModifiedAt,
                })
                .end();
        },
    );
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
