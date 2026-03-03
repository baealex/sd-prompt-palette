import { models } from '~/models';

import { LiveImagesImageRepository } from './live-images.image-repository';

const TEST_PREFIX = 'repo-orphan-delete';

const repository = new LiveImagesImageRepository();

async function cleanupSeed(): Promise<void> {
    await models.collection.deleteMany({
        where: {
            title: {
                startsWith: TEST_PREFIX,
            },
        },
    });
    await models.keyword.deleteMany({
        where: {
            name: {
                startsWith: TEST_PREFIX,
            },
        },
    });
    await models.liveSyncSourceLink.deleteMany({
        where: {
            sourcePath: {
                contains: TEST_PREFIX,
            },
        },
    });
    await models.imageMeta.deleteMany({
        where: {
            model: {
                startsWith: TEST_PREFIX,
            },
        },
    });
    await models.image.deleteMany({
        where: {
            hash: {
                startsWith: TEST_PREFIX,
            },
        },
    });
}

describe('LiveImagesImageRepository orphan delete', () => {
    beforeEach(async () => {
        await cleanupSeed();
    });

    afterEach(async () => {
        await cleanupSeed();
    });

    it('deletes image and relations when it is orphan', async () => {
        const image = await models.image.create({
            data: {
                hash: `${TEST_PREFIX}-hash-orphan`,
                url: '/assets/images/2026/3/3/repo-orphan.png',
                width: 320,
                height: 240,
                createdAt: new Date('2026-03-03T00:00:00.000Z'),
                generatedAt: new Date('2026-03-03T00:00:00.000Z'),
            },
        });

        await models.liveSyncSourceLink.create({
            data: {
                imageId: image.id,
                sourcePath: `C:\\${TEST_PREFIX}\\source-orphan.png`,
            },
        });
        await models.imageMeta.create({
            data: {
                imageId: image.id,
                sourceType: 'a1111_parameters',
                model: `${TEST_PREFIX}-model-orphan`,
                parseWarningsJson: '[]',
                parseVersion: 'test-v1',
            },
        });
        const keyword = await models.keyword.create({
            data: {
                name: `${TEST_PREFIX}-keyword-orphan`,
                imageId: image.id,
            },
        });

        const result = await repository.deleteImageAndRelationsIfOrphan(image.id);

        expect(result.deleted).toBe(true);
        expect(result.image?.id).toBe(image.id);
        expect(result.sourcePath).toBe(`C:\\${TEST_PREFIX}\\source-orphan.png`);

        const [savedImage, savedMeta, savedSourceLink, savedKeyword] =
            await Promise.all([
                models.image.findUnique({ where: { id: image.id } }),
                models.imageMeta.findUnique({ where: { imageId: image.id } }),
                models.liveSyncSourceLink.findUnique({
                    where: { imageId: image.id },
                }),
                models.keyword.findUnique({ where: { id: keyword.id } }),
            ]);

        expect(savedImage).toBeNull();
        expect(savedMeta).toBeNull();
        expect(savedSourceLink).toBeNull();
        expect(savedKeyword?.imageId).toBeNull();
    });

    it('keeps image when collections still reference it', async () => {
        const image = await models.image.create({
            data: {
                hash: `${TEST_PREFIX}-hash-linked`,
                url: '/assets/images/2026/3/3/repo-linked.png',
                width: 640,
                height: 480,
                createdAt: new Date('2026-03-03T00:00:00.000Z'),
                generatedAt: new Date('2026-03-03T00:00:00.000Z'),
            },
        });
        await models.collection.create({
            data: {
                imageId: image.id,
                title: `${TEST_PREFIX}-collection-linked`,
                prompt: 'prompt',
                negativePrompt: 'negative',
            },
        });

        const result = await repository.deleteImageAndRelationsIfOrphan(image.id);

        expect(result.deleted).toBe(false);
        expect(result.image?.id).toBe(image.id);

        const [savedImage, savedCollection] = await Promise.all([
            models.image.findUnique({ where: { id: image.id } }),
            models.collection.findFirst({
                where: {
                    imageId: image.id,
                    title: `${TEST_PREFIX}-collection-linked`,
                },
            }),
        ]);

        expect(savedImage).not.toBeNull();
        expect(savedCollection).not.toBeNull();
    });
});
