import fs from 'fs';
import os from 'os';
import path from 'path';
import exifr from 'exifr';

import {
    absolutePathFromImageUrl,
    createDestinationPath,
    deriveCreatedAt,
    extractPromptParts,
    imageUrlFromAbsolutePath,
    moveFile,
    normalizeIngestMode,
    resolveGeneratedAt,
    sanitizeLimit,
    sanitizePage,
} from './live-images.utils';
import { MAX_LIMIT } from './live-images.types';

jest.mock('exifr', () => ({
    __esModule: true,
    default: {
        parse: jest.fn(),
    },
}));

function withCode(message: string, code: string): NodeJS.ErrnoException {
    const error = new Error(message) as NodeJS.ErrnoException;
    error.code = code;
    return error;
}

describe('live-images.utils business logic', () => {
    const mockedExifrParse = exifr.parse as jest.MockedFunction<
        typeof exifr.parse
    >;

    const createStatsLike = (input: {
        atime?: Date;
        mtime: Date;
        ctime?: Date;
        birthtime: Date;
    }): fs.Stats => {
        const atime = input.atime || input.mtime;
        const ctime = input.ctime || input.mtime;
        return {
            atime,
            mtime: input.mtime,
            ctime,
            birthtime: input.birthtime,
            atimeMs: atime.getTime(),
            mtimeMs: input.mtime.getTime(),
            ctimeMs: ctime.getTime(),
            birthtimeMs: input.birthtime.getTime(),
        } as fs.Stats;
    };

    describe('timestamp resolution', () => {
        afterEach(() => {
            mockedExifrParse.mockReset();
            jest.restoreAllMocks();
        });

        it('prefers EXIF date for createdAt when available', async () => {
            // Arrange
            const exifDate = new Date('2021-04-03T02:01:00.000Z');
            const stats = createStatsLike({
                mtime: new Date('2024-04-01T11:00:00.000Z'),
                birthtime: new Date('2026-03-08T00:00:00.000Z'),
            });
            mockedExifrParse.mockResolvedValueOnce({
                DateTimeOriginal: exifDate,
            });

            // Act
            const createdAt = await deriveCreatedAt('dummy-file.png', stats);

            // Assert
            expect(createdAt.toISOString()).toBe(exifDate.toISOString());
        });

        it('falls back to mtime before birthtime when EXIF is missing', async () => {
            // Arrange
            const mtime = new Date('2020-01-02T03:04:05.000Z');
            const stats = createStatsLike({
                mtime,
                birthtime: new Date('2026-03-08T00:00:00.000Z'),
            });
            mockedExifrParse.mockRejectedValueOnce(new Error('parse failed'));

            // Act
            const createdAt = await deriveCreatedAt('dummy-file.png', stats);

            // Assert
            expect(createdAt.toISOString()).toBe(mtime.toISOString());
        });

        it('prefers mtime when EXIF date is newer than file time', async () => {
            // Arrange
            const mtime = new Date('2020-01-02T03:04:05.000Z');
            const stats = createStatsLike({
                mtime,
                birthtime: new Date('2026-03-08T00:00:00.000Z'),
            });
            mockedExifrParse.mockResolvedValueOnce({
                DateTimeOriginal: new Date('2026-03-08T12:34:56.000Z'),
            });

            // Act
            const createdAt = await deriveCreatedAt('dummy-file.png', stats);

            // Assert
            expect(createdAt.toISOString()).toBe(mtime.toISOString());
        });

        it('resolves generatedAt from the earliest available file timestamp', () => {
            // Arrange
            const earliestAtime = new Date('2018-12-31T10:20:30.000Z');
            const mtime = new Date('2019-12-31T10:20:30.000Z');
            const stats = createStatsLike({
                atime: earliestAtime,
                mtime,
                ctime: new Date('2024-01-01T00:00:00.000Z'),
                birthtime: new Date('2026-03-08T00:00:00.000Z'),
            });

            // Act
            const generatedAt = resolveGeneratedAt(stats);

            // Assert
            expect(generatedAt.toISOString()).toBe(earliestAtime.toISOString());
        });
    });

    describe('pagination and config sanitizing', () => {
        it('clamps and normalizes limit values', () => {
            // Arrange
            const floatingLimit = '42.9';
            const tooLargeLimit = MAX_LIMIT + 500;
            const invalidLimit = 0;
            const fallbackLimit = 15;

            // Act
            const parsedFloatingLimit = sanitizeLimit(floatingLimit);
            const clampedLimit = sanitizeLimit(tooLargeLimit);
            const fallbackResult = sanitizeLimit(invalidLimit, fallbackLimit);

            // Assert
            expect(parsedFloatingLimit).toBe(42);
            expect(clampedLimit).toBe(MAX_LIMIT);
            expect(fallbackResult).toBe(fallbackLimit);
        });

        it('normalizes page values', () => {
            // Arrange
            const floatingPage = '3.7';
            const invalidPage = -2;
            const fallbackPage = 4;
            const notANumberPage = 'NaN';

            // Act
            const parsedFloatingPage = sanitizePage(floatingPage);
            const fallbackFromNegative = sanitizePage(
                invalidPage,
                fallbackPage,
            );
            const fallbackFromNaN = sanitizePage(notANumberPage, 2);

            // Assert
            expect(parsedFloatingPage).toBe(3);
            expect(fallbackFromNegative).toBe(4);
            expect(fallbackFromNaN).toBe(2);
        });

        it('normalizes ingest mode', () => {
            // Arrange
            const moveLower = 'move';
            const moveUpper = 'MOVE';
            const copy = 'copy';
            const unknown = 'other';

            // Act
            const normalizedMoveLower = normalizeIngestMode(moveLower);
            const normalizedMoveUpper = normalizeIngestMode(moveUpper);
            const normalizedCopy = normalizeIngestMode(copy);
            const normalizedUnknown = normalizeIngestMode(unknown);

            // Assert
            expect(normalizedMoveLower).toBe('move');
            expect(normalizedMoveUpper).toBe('move');
            expect(normalizedCopy).toBe('copy');
            expect(normalizedUnknown).toBe('copy');
        });
    });

    describe('prompt parsing', () => {
        it('parses ComfyUI positive and negative prompt sections', () => {
            // Arrange
            const rawPrompt = `
Positive Prompt
cinematic photo of a city

Negative Prompt
blurry, low quality
            `;

            // Act
            const parsed = extractPromptParts(rawPrompt);

            // Assert
            expect(parsed).toEqual({
                prompt: 'cinematic photo of a city',
                negativePrompt: 'blurry, low quality',
            });
        });

        it('parses A1111 style prompt metadata', () => {
            // Arrange
            const rawPrompt = `
portrait, masterpiece
Negative prompt: lowres, bad anatomy
Steps: 25, Sampler: Euler a
            `;

            // Act
            const parsed = extractPromptParts(rawPrompt);

            // Assert
            expect(parsed).toEqual({
                prompt: 'portrait, masterpiece',
                negativePrompt: 'lowres, bad anatomy',
            });
        });

        it('keeps plain prompt text when no negative section exists', () => {
            // Arrange
            const rawPrompt = 'single prompt only';

            // Act
            const parsed = extractPromptParts(rawPrompt);

            // Assert
            expect(parsed).toEqual({
                prompt: 'single prompt only',
                negativePrompt: '',
            });
        });
    });

    describe('path conversion and traversal guard', () => {
        const imageBaseDirPath = path.resolve('/tmp/live-images-library');

        it('encodes URL paths and resolves back to original absolute path', () => {
            // Arrange
            const absolutePath = path.resolve(
                imageBaseDirPath,
                '2026',
                '2',
                'poster #1.png',
            );

            // Act
            const url = imageUrlFromAbsolutePath(
                imageBaseDirPath,
                absolutePath,
            );
            const resolvedAbsolutePath = absolutePathFromImageUrl(
                imageBaseDirPath,
                url as string,
            );

            // Assert
            expect(url).toBe('/assets/images/2026/2/poster%20%231.png');
            expect(resolvedAbsolutePath).toBe(absolutePath);
        });

        it('blocks directory traversal paths', () => {
            // Arrange
            const encodedTraversalPath = '/assets/images/..%2Fsecret.png';
            const plainTraversalPath = '/assets/images/../../secret.png';
            const wrongPrefixPath = '/api/images/a.png';

            // Act
            const fromEncodedTraversal = absolutePathFromImageUrl(
                imageBaseDirPath,
                encodedTraversalPath,
            );
            const fromPlainTraversal = absolutePathFromImageUrl(
                imageBaseDirPath,
                plainTraversalPath,
            );
            const fromWrongPrefix = absolutePathFromImageUrl(
                imageBaseDirPath,
                wrongPrefixPath,
            );

            // Assert
            expect(fromEncodedTraversal).toBeNull();
            expect(fromPlainTraversal).toBeNull();
            expect(fromWrongPrefix).toBeNull();
        });
    });

    describe('destination path allocation', () => {
        let tempDirPath = '';

        beforeEach(async () => {
            tempDirPath = await fs.promises.mkdtemp(
                path.join(os.tmpdir(), 'ocean-palette-live-images-'),
            );
        });

        afterEach(async () => {
            await fs.promises.rm(tempDirPath, { recursive: true, force: true });
        });

        it('creates date directory and appends suffix when base filename is taken', async () => {
            // Arrange
            const createdAt = new Date(2026, 1, 15, 12, 0, 0);
            const serverRegisteredAtMs = 1_772_037_001_443;
            const hash =
                '12ABCDEF34567890FFFEEE1111222233334444555566667777888899990000';
            const registeredAt = new Date(serverRegisteredAtMs);
            const serverTimeToken = `${String(registeredAt.getHours()).padStart(2, '0')}${String(registeredAt.getMinutes()).padStart(2, '0')}${String(registeredAt.getSeconds()).padStart(2, '0')}`;
            const basePath = path.resolve(
                tempDirPath,
                '2026',
                '2',
                '15',
                `${createdAt.getTime()}-${serverTimeToken}-12abcdef3456.png`,
            );

            // Act
            const firstPath = await createDestinationPath({
                imageBaseDirPath: tempDirPath,
                createdAt,
                serverRegisteredAtMs,
                contentHash: hash,
                extensionWithDot: 'PNG',
            });
            await fs.promises.writeFile(firstPath, 'occupied');
            const secondPath = await createDestinationPath({
                imageBaseDirPath: tempDirPath,
                createdAt,
                serverRegisteredAtMs,
                contentHash: hash,
                extensionWithDot: '.png',
            });
            const secondExpectedPath = path.resolve(
                tempDirPath,
                '2026',
                '2',
                '15',
                `${createdAt.getTime()}-${serverTimeToken}-12abcdef3456_1.png`,
            );

            // Assert
            expect(firstPath).toBe(basePath);
            expect(secondPath).toBe(secondExpectedPath);
        });
    });

    describe('cross-device move fallback', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('falls back to copy/unlink when rename fails with EXDEV', async () => {
            // Arrange
            const renameSpy = jest
                .spyOn(fs.promises, 'rename')
                .mockRejectedValueOnce(withCode('cross-device move', 'EXDEV'));
            const copySpy = jest
                .spyOn(fs.promises, 'copyFile')
                .mockResolvedValueOnce();
            const unlinkSpy = jest
                .spyOn(fs.promises, 'unlink')
                .mockResolvedValueOnce();

            // Act
            await moveFile('from-path', 'to-path');

            // Assert
            expect(renameSpy).toHaveBeenCalledWith('from-path', 'to-path');
            expect(copySpy).toHaveBeenCalledWith('from-path', 'to-path');
            expect(unlinkSpy).toHaveBeenCalledWith('from-path');
        });

        it('rethrows non-EXDEV rename errors', async () => {
            // Arrange
            const error = withCode('permission denied', 'EPERM');
            jest.spyOn(fs.promises, 'rename').mockRejectedValueOnce(error);

            // Act / Assert
            await expect(moveFile('from-path', 'to-path')).rejects.toBe(error);
        });
    });
});
