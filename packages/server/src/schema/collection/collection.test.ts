import request from 'supertest';

import { app } from '~/app';
import { models } from '~/models';

interface CollectionSeed {
    imageId: number;
    title: string;
}

const seededCollections: CollectionSeed[] = [];

beforeAll(async () => {
    const imageA = await models.image.create({
        data: {
            hash: 'collection-test-hash-a',
            url: '/assets/images/2026/3/1/collection-a.png',
            width: 640,
            height: 480,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            generatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
    });
    const imageB = await models.image.create({
        data: {
            hash: 'collection-test-hash-b',
            url: '/assets/images/2026/3/2/collection-b.png',
            width: 1024,
            height: 768,
            createdAt: new Date('2026-03-02T00:00:00.000Z'),
            generatedAt: new Date('2026-03-02T00:00:00.000Z'),
        },
    });

    await models.imageMeta.create({
        data: {
            imageId: imageA.id,
            sourceType: 'a1111_parameters',
            prompt: 'portrait lighting',
            negativePrompt: 'blurry',
            model: 'model-a',
            parseWarningsJson: JSON.stringify(['warn-a']),
            parseVersion: 'test-v1',
        },
    });
    await models.imageMeta.create({
        data: {
            imageId: imageB.id,
            sourceType: 'comfy_prompt',
            prompt: 'city skyline',
            negativePrompt: 'noise',
            model: 'model-b',
            parseWarningsJson: JSON.stringify(['warn-b']),
            parseVersion: 'test-v1',
        },
    });

    const collectionA = await models.collection.create({
        data: {
            imageId: imageA.id,
            title: 'Portrait A',
            prompt: 'portrait lighting',
            negativePrompt: 'blurry',
            createdAt: new Date('2026-03-01T10:00:00.000Z'),
        },
    });
    const collectionB = await models.collection.create({
        data: {
            imageId: imageB.id,
            title: 'City B',
            prompt: 'city skyline',
            negativePrompt: 'noise',
            createdAt: new Date('2026-03-02T10:00:00.000Z'),
        },
    });

    seededCollections.push(
        {
            imageId: imageA.id,
            title: collectionA.title || '',
        },
        {
            imageId: imageB.id,
            title: collectionB.title || '',
        },
    );
});

afterAll(async () => {
    await models.collection.deleteMany({
        where: {
            title: {
                in: seededCollections.map((item) => item.title),
            },
        },
    });
    await models.imageMeta.deleteMany({
        where: {
            imageId: {
                in: seededCollections.map((item) => item.imageId),
            },
        },
    });
    await models.image.deleteMany({
        where: {
            id: {
                in: seededCollections.map((item) => item.imageId),
            },
        },
    });
});

async function runGraphql(query: string) {
    return request(app).post('/graphql').send({ query });
}

describe('Collection Schema', () => {
    it('returns model options sorted', async () => {
        const response = await runGraphql(`
            query {
                collectionModelOptions
            }
        `);

        expect(response.status).toBe(200);
        expect(response.body.data.collectionModelOptions).toEqual([
            'model-a',
            'model-b',
        ]);
    });

    it('returns allCollections with pagination and generated metadata', async () => {
        const response = await runGraphql(`
            query {
                allCollections(
                    orderBy: "generatedAt"
                    order: "desc"
                    limit: 1
                    offset: 0
                ) {
                    collections {
                        id
                        title
                        generatedAt
                        image {
                            id
                            url
                        }
                        generatedMetadata {
                            model
                            parseVersion
                            parseWarnings
                        }
                    }
                    pagination {
                        limit
                        offset
                        total
                    }
                }
            }
        `);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.allCollections.pagination.limit).toBe(1);
        expect(response.body.data.allCollections.pagination.offset).toBe(0);
        expect(response.body.data.allCollections.pagination.total).toBeGreaterThanOrEqual(
            2,
        );
        expect(response.body.data.allCollections.collections).toHaveLength(1);

        const [firstItem] = response.body.data.allCollections.collections;
        expect(firstItem.title).toBe('City B');
        expect(firstItem.generatedMetadata.model).toBe('model-b');
        expect(firstItem.generatedMetadata.parseVersion).toBe('test-v1');
        expect(firstItem.generatedMetadata.parseWarnings).toEqual(['warn-b']);
    });

    it('filters collections by prompt query and model', async () => {
        const response = await runGraphql(`
            query {
                allCollections(
                    query: "portrait"
                    searchBy: "prompt"
                    model: "model-a"
                    dateField: "generated_at"
                    dateFrom: "2026-03-01T00:00:00.000Z"
                    dateTo: "2026-03-01T23:59:59.999Z"
                ) {
                    collections {
                        id
                        title
                    }
                    pagination {
                        total
                    }
                }
            }
        `);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.allCollections.collections).toHaveLength(1);
        expect(response.body.data.allCollections.collections[0].title).toBe(
            'Portrait A',
        );
    });
});
