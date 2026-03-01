import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import exifr from 'exifr';

import { readImageMetadata, readImageMetadataFromBuffer, readImagePrompt } from './prompt-reader';

jest.mock('exifr', () => ({
    __esModule: true,
    default: {
        parse: jest.fn(),
    },
}));

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function createPngChunk(chunkType: string, data: Buffer): Buffer {
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(chunkType, 'ascii');
    const crcBuffer = Buffer.alloc(4);
    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function createTextChunk(keyword: string, text: string): Buffer {
    const data = Buffer.concat([
        Buffer.from(keyword, 'latin1'),
        Buffer.from([0]),
        Buffer.from(text, 'utf8'),
    ]);
    return createPngChunk('tEXt', data);
}

function createZtxtChunk(keyword: string, text: string): Buffer {
    const compressed = zlib.deflateSync(Buffer.from(text, 'utf8'));
    const data = Buffer.concat([
        Buffer.from(keyword, 'latin1'),
        Buffer.from([0]),
        Buffer.from([0]),
        compressed,
    ]);
    return createPngChunk('zTXt', data);
}

function createPngBuffer(chunks: Buffer[]): Buffer {
    return Buffer.concat([
        PNG_SIGNATURE,
        ...chunks,
        createPngChunk('IEND', Buffer.alloc(0)),
    ]);
}

async function writeTempPng(chunks: Buffer[]): Promise<{ filePath: string; dirPath: string }> {
    const dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ocean-palette-prompt-reader-'));
    const filePath = path.resolve(dirPath, 'sample.png');
    const pngBuffer = createPngBuffer(chunks);

    await fs.promises.writeFile(filePath, pngBuffer);
    return { filePath, dirPath };
}

describe('readImagePrompt business logic', () => {
    const mockedParse = exifr.parse as unknown as jest.Mock;
    const tempDirPaths: string[] = [];

    afterEach(async () => {
        // Arrange
        const cleanupTargets = [...tempDirPaths];
        tempDirPaths.length = 0;
        mockedParse.mockReset();

        // Act
        await Promise.all(cleanupTargets.map((dirPath) => fs.promises.rm(dirPath, {
            recursive: true,
            force: true,
        })));
    });

    it('prefers PNG parameters metadata over other keys', async () => {
        // Arrange
        const { filePath, dirPath } = await writeTempPng([
            createTextChunk('prompt', '{"raw":"value"}'),
            createTextChunk('parameters', 'masterpiece portrait'),
        ]);
        tempDirPaths.push(dirPath);

        // Act
        const prompt = await readImagePrompt(filePath);

        // Assert
        expect(prompt).toBe('masterpiece portrait');
    });

    it('formats Comfy prompt JSON into positive and negative sections', async () => {
        // Arrange
        const comfyPromptGraph = JSON.stringify({
            1: {
                class_type: 'KSampler',
                inputs: {
                    positive: ['2', 0],
                    negative: ['3', 0],
                },
            },
            2: {
                class_type: 'CLIPTextEncode',
                inputs: {
                    text: 'sunset skyline',
                },
            },
            3: {
                class_type: 'CLIPTextEncode',
                inputs: {
                    text: 'blurry, low quality',
                },
            },
        });
        const { filePath, dirPath } = await writeTempPng([
            createTextChunk('prompt', comfyPromptGraph),
        ]);
        tempDirPaths.push(dirPath);

        // Act
        const prompt = await readImagePrompt(filePath);

        // Assert
        expect(prompt).toBe(
            'Positive Prompt\nsunset skyline\n\nNegative Prompt\nblurry, low quality'
        );
    });

    it('reads compressed zTXt prompt metadata', async () => {
        // Arrange
        const { filePath, dirPath } = await writeTempPng([
            createZtxtChunk('comment', 'studio light portrait'),
        ]);
        tempDirPaths.push(dirPath);

        // Act
        const prompt = await readImagePrompt(filePath);

        // Assert
        expect(prompt).toBe('studio light portrait');
    });

    it('falls back to EXIF metadata when PNG text chunks are missing', async () => {
        // Arrange
        const { filePath, dirPath } = await writeTempPng([]);
        tempDirPaths.push(dirPath);
        mockedParse.mockResolvedValueOnce({
            UserComment: 'fallback exif prompt',
        });

        // Act
        const prompt = await readImagePrompt(filePath);

        // Assert
        expect(prompt).toBe('fallback exif prompt');
        expect(mockedParse).toHaveBeenCalledWith(expect.any(Buffer));
    });

    it('returns empty string when metadata does not contain prompt text', async () => {
        // Arrange
        const { filePath, dirPath } = await writeTempPng([]);
        tempDirPaths.push(dirPath);
        mockedParse.mockResolvedValueOnce(null);

        // Act
        const prompt = await readImagePrompt(filePath);

        // Assert
        expect(prompt).toBe('');
    });

    it('extracts structured A1111 metadata fields', async () => {
        // Arrange
        const parameters = [
            'masterpiece portrait',
            'Negative prompt: blurry, low quality',
            'Steps: 30, Sampler: DPM++ 2M Karras, CFG scale: 6.5, Seed: 1234, Size: 1024x1024, Model: juggernautXL_v9, Model hash: abc123, Hires steps: 12, Hires upscale: 1.5, Hires upscaler: 4x-UltraSharp',
        ].join('\n');
        const { filePath, dirPath } = await writeTempPng([
            createTextChunk('parameters', parameters),
        ]);
        tempDirPaths.push(dirPath);

        // Act
        const metadata = await readImageMetadata(filePath);

        // Assert
        expect(metadata.prompt).toBe('masterpiece portrait');
        expect(metadata.negativePrompt).toBe('blurry, low quality');
        expect(metadata.model).toBe('juggernautXL_v9');
        expect(metadata.baseSteps).toBe(30);
        expect(metadata.upscaleSteps).toBe(12);
        expect(metadata.upscaleFactor).toBe(1.5);
    });

    it('returns safe empty metadata for empty buffer', async () => {
        // Act
        const metadata = await readImageMetadataFromBuffer(Buffer.alloc(0), {
            extension: '.png',
        });

        // Assert
        expect(metadata.sourceType).toBe('unknown');
        expect(metadata.prompt).toBe('');
        expect(metadata.parseWarnings.length).toBeGreaterThan(0);
    });
});
