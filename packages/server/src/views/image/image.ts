import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crpyto from 'crypto';

import { Controller } from '~/types';
import models from '~/models';

const imageDir = path.resolve('./public/assets/images');

function makePath(dirs: string[]) {
    let currentPath = '';
    for (const dir of dirs) {
        currentPath = path.resolve(currentPath, dir);
        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
        }
    }
}

export const uploadImage: Controller = async (req, res) => {
    const { image } = req.body;

    if (!image || !image.includes('data:image/png;base64,')) {
        res.status(400).json({ error: 'No image uploaded' }).end();
        return;
    }

    const [info, data] = image.split(',');

    const hash = crpyto.createHash('sha512').update(data).digest('hex');

    const exists = await models.image.findUnique({
        where: {
            hash,
        },
    });

    if (exists) {
        res.status(200).json({
            id: exists.id,
            url: exists.url,
            width: exists.width,
            height: exists.height,
        }).end();
        return;
    }

    const currentPath = [
        (new Date().getFullYear()).toString(),
        (new Date().getMonth() + 1).toString(),
        (new Date().getDate()).toString()
    ];
    makePath(['./public', 'assets', 'images', ...currentPath]);

    const ext = info.split(';')[0].split('/')[1];
    const fileName = `${Date.now()}.${ext}`;

    const buffer = Buffer.from(data, 'base64');

    const sharpImage = sharp(buffer);
    const previewImage = await sharpImage.blur(100).jpeg({ quality: 50 }).toBuffer();
    const previewFileName = fileName.replace(`.${ext}`, '.preview.jpg');

    fs.writeFile(path.resolve(imageDir, ...currentPath, previewFileName), previewImage, async (err) => {
        if (err) {
            res.status(500).json({ error: err }).end();
            return;
        }
    });

    fs.writeFile(path.resolve(imageDir, ...currentPath, fileName), buffer, async (err) => {
        if (err) {
            res.status(500).json({ error: err }).end();
            return;
        }

        const metadata = await sharpImage.metadata();

        const url = '/assets/images/' + currentPath.join('/') + '/' + fileName;
        const image = await models.image.create({
            data: {
                hash,
                url,
                width: metadata.width || 0,
                height: metadata.height || 0,
            },
        });
        res.status(200).json({
            id: image.id,
            url: image.url,
            width: image.width,
            height: image.height,
        }).end();
    });
};
