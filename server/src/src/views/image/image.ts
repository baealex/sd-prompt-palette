import fs from 'fs';
import path from 'path';
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
            url: exists.url
        }).end();
        return;
    }

    const currentPath = [
        (new Date().getFullYear()).toString(),
        (new Date().getMonth() + 1).toString(),
        (new Date().getDate()).toString()
    ];
    makePath(['./public/assets', 'images', ...currentPath]);

    const ext = info.split(';')[0].split('/')[1];
    const fileName = `${Date.now()}.${ext}`;

    fs.writeFile(path.resolve(imageDir, ...currentPath, fileName), Buffer.from(data, 'base64'), async (err) => {
        if (err) {
            res.status(500).json({ error: err }).end();
            return;
        }

        const url = '/assets/images/' + currentPath.join('/') + '/' + fileName;
        const image = await models.image.create({
            data: {
                hash,
                url,
            },
        });
        res.status(200).json({
            id: image.id,
            url: image.url,
        }).end();
    });
};