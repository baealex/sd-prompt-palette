import {
    parseUploadDataUrlImage,
    uploadImageFromDataUrl,
} from '~/modules/image-upload.service';
import { readImageMetadataFromBuffer } from '~/modules/prompt-reader';
import { Controller } from '~/types';

export const uploadImage: Controller = async (req, res) => {
    const image = await uploadImageFromDataUrl(req.body?.image);
    if (!image) {
        res.status(400).json({ error: 'No image uploaded' }).end();
        return;
    }

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
    const buffer = parseUploadDataUrlImage(req.body?.image);
    if (!buffer) {
        res.status(400)
            .json({
                ok: false,
                message: 'No image uploaded',
            })
            .end();
        return;
    }

    const metadata = await readImageMetadataFromBuffer(buffer);

    res.status(200)
        .json({
            ok: true,
            metadata,
        })
        .end();
};
