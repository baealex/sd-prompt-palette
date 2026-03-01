import type { Request, Response } from 'express';

import {
    parseUploadDataUrlImage,
    uploadImageFromDataUrl,
} from '~/modules/image-upload.service';
import { readImageMetadataFromBuffer } from '~/modules/prompt-reader';
import { parseImageMetadata, uploadImage } from './image';

jest.mock('~/modules/image-upload.service', () => ({
    parseUploadDataUrlImage: jest.fn(),
    uploadImageFromDataUrl: jest.fn(),
}));

jest.mock('~/modules/prompt-reader', () => ({
    readImageMetadataFromBuffer: jest.fn(),
}));

type MockResponse = Response & {
    status: jest.Mock;
    json: jest.Mock;
    end: jest.Mock;
};

function createMockResponse(): MockResponse {
    const response = {} as MockResponse;
    response.status = jest.fn().mockReturnValue(response);
    response.json = jest.fn().mockReturnValue(response);
    response.end = jest.fn().mockReturnValue(response);
    return response;
}

function createMockRequest(body: Record<string, unknown> = {}): Request {
    return {
        body,
    } as unknown as Request;
}

describe('image controllers', () => {
    const mockedUploadImageFromDataUrl =
        uploadImageFromDataUrl as jest.MockedFunction<
            typeof uploadImageFromDataUrl
        >;
    const mockedParseUploadDataUrlImage =
        parseUploadDataUrlImage as jest.MockedFunction<
            typeof parseUploadDataUrlImage
        >;
    const mockedReadImageMetadataFromBuffer =
        readImageMetadataFromBuffer as jest.MockedFunction<
            typeof readImageMetadataFromBuffer
        >;

    beforeEach(() => {
        mockedUploadImageFromDataUrl.mockReset();
        mockedParseUploadDataUrlImage.mockReset();
        mockedReadImageMetadataFromBuffer.mockReset();
    });

    it('returns 400 when upload payload is invalid', async () => {
        const req = createMockRequest({ image: 'invalid' });
        const res = createMockResponse();
        mockedUploadImageFromDataUrl.mockResolvedValueOnce(null);

        await uploadImage(req, res);

        expect(mockedUploadImageFromDataUrl).toHaveBeenCalledWith('invalid');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No image uploaded' });
    });

    it('returns image payload when upload succeeds', async () => {
        const req = createMockRequest({ image: 'data:image/png;base64,abc' });
        const res = createMockResponse();
        mockedUploadImageFromDataUrl.mockResolvedValueOnce({
            id: 10,
            url: '/assets/images/2026/3/2/sample.png',
            width: 512,
            height: 512,
            generatedAt: new Date('2026-03-02T00:00:00.000Z'),
        });

        await uploadImage(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            id: 10,
            url: '/assets/images/2026/3/2/sample.png',
            width: 512,
            height: 512,
            generatedAt: new Date('2026-03-02T00:00:00.000Z'),
        });
    });

    it('returns 400 when metadata payload is invalid', async () => {
        const req = createMockRequest({ image: '' });
        const res = createMockResponse();
        mockedParseUploadDataUrlImage.mockReturnValueOnce(null);

        await parseImageMetadata(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: 'No image uploaded',
        });
    });

    it('returns parsed metadata', async () => {
        const req = createMockRequest({ image: 'data:image/png;base64,abc' });
        const res = createMockResponse();
        const buffer = Buffer.from('png');
        mockedParseUploadDataUrlImage.mockReturnValueOnce(buffer);
        mockedReadImageMetadataFromBuffer.mockResolvedValueOnce({
            prompt: 'portrait',
            negativePrompt: 'blurry',
            sourceType: 'a1111_parameters',
            parseWarnings: [],
            parseVersion: 'v-test',
        });

        await parseImageMetadata(req, res);

        expect(mockedReadImageMetadataFromBuffer).toHaveBeenCalledWith(buffer);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            metadata: {
                prompt: 'portrait',
                negativePrompt: 'blurry',
                sourceType: 'a1111_parameters',
                parseWarnings: [],
                parseVersion: 'v-test',
            },
        });
    });
});
