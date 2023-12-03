import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import app from './app';
import models from './models';

const PORT = process.env.PORT || 3332;

app.listen(PORT, () => console.log(`http server listen on :${PORT}`));

function walk(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

async function main() {
    const files = walk(path.join(__dirname, '../public/assets/images'));
    for (const file of files) {
        if (file.endsWith('.preview.jpg')) {
            continue;
        }

        const fileDir = path.dirname(file);
        const filename = path.basename(file);
        const [name] = filename.split('.');

        const previewFileName = `${name}.preview.jpg`;

        if (fs.existsSync(path.join(fileDir, previewFileName))) {
            continue;
        }

        const buffer = fs.readFileSync(file);
        const sharpImage = sharp(buffer);
        const previewImage = await sharpImage.blur(100).jpeg({ quality: 50 }).toBuffer();

        fs.writeFileSync(path.join(fileDir, previewFileName), previewImage);

        const metadata = await sharpImage.metadata();

        const url = '/assets/images/' + fileDir.split('/').slice(-3).join('/') + '/' + filename;
        const image = await models.image.findFirst({
            where: {
                url,
            },
        });

        if (image && (image.width === 0 || image.height === 0)) {
            console.log(image.url);
            await models.image.update({
                where: {
                    id: image.id,
                },
                data: {
                    width: metadata.width || 0,
                    height: metadata.height || 0,
                },
            });
        }
    }
}

main();