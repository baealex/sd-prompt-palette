import type { Request, Response } from 'express';

import liveImagesService from '~/modules/live-images';
import {
    deleteLiveImage,
    getLiveImagePrompt,
    listLiveImages,
    syncLiveImages,
    updateLiveConfig,
} from './live';

jest.mock('~/modules/live-images', () => ({
    __esModule: true,
    default: {
        getConfig: jest.fn(),
        getStatus: jest.fn(),
        updateConfig: jest.fn(),
        listImages: jest.fn(),
        getPrompt: jest.fn(),
        deleteImage: jest.fn(),
        syncNow: jest.fn(),
    },
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

function createMockRequest({
    params = {},
    query = {},
    body = {},
}: {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
} = {}): Request {
    return {
        params,
        query,
        body,
    } as unknown as Request;
}

describe('live controllers business logic', () => {
    const mockedService = liveImagesService as unknown as {
        getStatus: jest.Mock;
        updateConfig: jest.Mock;
        listImages: jest.Mock;
        getPrompt: jest.Mock;
        deleteImage: jest.Mock;
        syncNow: jest.Mock;
    };

    beforeEach(() => {
        mockedService.getStatus.mockReset();
        mockedService.updateConfig.mockReset();
        mockedService.listImages.mockReset();
        mockedService.getPrompt.mockReset();
        mockedService.deleteImage.mockReset();
        mockedService.syncNow.mockReset();
    });

    it('updates config with parsed booleans from request body', async () => {
        // Arrange
        const req = createMockRequest({
            body: {
                watchDir: 'C:\\watch',
                ingestMode: 'move',
                deleteSourceOnDelete: '1',
                enabled: 'false',
            },
        });
        const res = createMockResponse();
        const config = {
            watchDir: 'C:\\watch',
            ingestMode: 'move',
            deleteSourceOnDelete: true,
            enabled: false,
            updatedAt: 10,
        };
        const status = {
            watchersRunning: true,
        };
        mockedService.updateConfig.mockResolvedValueOnce(config);
        mockedService.getStatus.mockReturnValueOnce(status);

        // Act
        await updateLiveConfig(req, res);

        // Assert
        expect(mockedService.updateConfig).toHaveBeenCalledWith({
            watchDir: 'C:\\watch',
            ingestMode: 'move',
            deleteSourceOnDelete: true,
            enabled: false,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            config,
            status,
        });
    });

    it('returns 400 for invalid image id on get prompt', async () => {
        // Arrange
        const req = createMockRequest({
            params: { id: 'invalid' },
        });
        const res = createMockResponse();

        // Act
        await getLiveImagePrompt(req, res);

        // Assert
        expect(mockedService.getPrompt).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: 'invalid image id',
        });
    });

    it('returns 404 when prompt target image does not exist', async () => {
        // Arrange
        const req = createMockRequest({
            params: { id: '42' },
        });
        const res = createMockResponse();
        mockedService.getPrompt.mockResolvedValueOnce({
            image: null,
            prompt: '',
        });

        // Act
        await getLiveImagePrompt(req, res);

        // Assert
        expect(mockedService.getPrompt).toHaveBeenCalledWith(42);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: 'image not found',
        });
    });

    it('returns prompt payload when image exists', async () => {
        // Arrange
        const req = createMockRequest({
            params: { id: '11' },
        });
        const res = createMockResponse();
        mockedService.getPrompt.mockResolvedValueOnce({
            image: {
                id: 11,
            },
            prompt: 'cinematic shot',
        });

        // Act
        await getLiveImagePrompt(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            id: 11,
            prompt: 'cinematic shot',
        });
    });

    it('returns 404 when delete target does not exist', async () => {
        // Arrange
        const req = createMockRequest({
            params: { id: '7' },
        });
        const res = createMockResponse();
        mockedService.deleteImage.mockResolvedValueOnce(null);

        // Act
        await deleteLiveImage(req, res);

        // Assert
        expect(mockedService.deleteImage).toHaveBeenCalledWith(7);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: 'image not found',
        });
    });

    it('returns 500 and error message when sync fails', async () => {
        // Arrange
        const req = createMockRequest();
        const res = createMockResponse();
        mockedService.syncNow.mockRejectedValueOnce(new Error('sync failed'));

        // Act
        await syncLiveImages(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: 'sync failed',
        });
    });

    it('forwards numeric page and limit to listImages', async () => {
        // Arrange
        const req = createMockRequest({
            query: {
                page: '3',
                limit: '25',
            },
        });
        const res = createMockResponse();
        const payload = {
            page: 3,
            limit: 25,
            total: 120,
            hasMore: true,
            images: [],
        };
        mockedService.listImages.mockResolvedValueOnce(payload);

        // Act
        await listLiveImages(req, res);

        // Assert
        expect(mockedService.listImages).toHaveBeenCalledWith({
            page: 3,
            limit: 25,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            updatedAt: expect.any(Number),
            ...payload,
        });
    });
});
