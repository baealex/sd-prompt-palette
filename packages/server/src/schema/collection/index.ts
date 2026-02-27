import { IResolvers } from '@graphql-tools/utils';

import { Collection, models, Order, Pagination, Search } from '~/models';
import { gql } from '~/modules/graphql';
import { liveImagesService } from '~/modules/live-images';

interface AllCollections {
    collections: Collection[];
    pagination: Pagination;
}

function resolveCollectionOrderBy(
    orderBy?: string,
    order: 'asc' | 'desc' = 'desc',
) {
    const normalizedOrder = order === 'asc' ? 'asc' : 'desc';
    if (orderBy === 'fileCreatedAt') {
        return {
            image: {
                fileCreatedAt: normalizedOrder,
            },
        } as const;
    }
    if (orderBy === 'fileModifiedAt') {
        return {
            image: {
                fileModifiedAt: normalizedOrder,
            },
        } as const;
    }
    return {
        [orderBy || 'createdAt']: normalizedOrder,
    } as const;
}

export const CollectionType = gql`
    type Collection {
        id: ID!
        image: Image!
        title: String!
        prompt: String!
        negativePrompt: String!
        fileCreatedAt: String
        fileModifiedAt: String
        generatedMetadata: GeneratedMetadata
        createdAt: String!
        updatedAt: String!
    }

    type GeneratedMetadata {
        sourceType: String!
        prompt: String!
        negativePrompt: String!
        model: String
        modelHash: String
        baseSampler: String
        baseScheduler: String
        baseSteps: Int
        baseCfgScale: Float
        baseSeed: String
        upscaleSampler: String
        upscaleScheduler: String
        upscaleSteps: Int
        upscaleCfgScale: Float
        upscaleSeed: String
        upscaleFactor: Float
        upscaler: String
        sizeWidth: Int
        sizeHeight: Int
        clipSkip: Int
        vae: String
        denoiseStrength: Float
        createdAtFromMeta: String
        parseWarnings: [String!]!
        parseVersion: String!
    }

    type Image {
        id: ID!
        url: String!
        width: Int!
        height: Int!
        createdAt: String!
    }

    type Pagination {
        limit: Int!
        offset: Int!
        total: Int!
    }

    type AllCollections {
        collections: [Collection!]!
        pagination: Pagination!
    }
`;

export const CollectionQuery = gql`
    type Query {
        allCollections(orderBy: String, order: String, query: String, limit: Int, offset: Int): AllCollections!
        collection(id: ID!): Collection!
    }
`;

export const CollectionMutation = gql`
    type Mutation {
        createCollection(imageId: ID!, title: String!, prompt: String!, negativePrompt: String!): Collection!
        updateCollection(id: ID!, imageId: ID, title: String, prompt: String, negativePrompt: String): Collection!
        deleteCollection(id: ID!): Boolean!
    }
`;

export const CollectionTypeDefs = `
    ${CollectionType}
    ${CollectionQuery}
    ${CollectionMutation}
`;

export const CollectionResolvers: IResolvers = {
    Query: {
        allCollections:
            (
                _,
                {
                    orderBy,
                    order,
                    query,
                    limit,
                    offset,
                }: Order & Pagination & Search,
            ) =>
            async () => {
                const where = query
                    ? {
                          OR: [
                              {
                                  title: {
                                      contains: query,
                                  },
                              },
                              {
                                  prompt: {
                                      contains: query,
                                  },
                              },
                              {
                                  negativePrompt: {
                                      contains: query,
                                  },
                              },
                          ],
                      }
                    : undefined;

                const collections = await models.collection.findMany({
                    orderBy: resolveCollectionOrderBy(orderBy, order || 'desc'),
                    where,
                    take: limit,
                    skip: offset,
                });
                const pagination = {
                    limit,
                    offset,
                    total: await models.collection.count({ where }),
                };
                return {
                    collections,
                    pagination,
                };
            },
        collection: (_, { id }: Collection) =>
            models.collection.findUnique({
                where: {
                    id: Number(id),
                },
            }),
    },
    Mutation: {
        createCollection: async (
            _,
            { imageId, title, prompt, negativePrompt }: Collection,
        ) => {
            imageId = Number(imageId);

            const collection = await models.collection.create({
                data: {
                    image: {
                        connect: {
                            id: imageId,
                        },
                    },
                    title,
                    prompt,
                    negativePrompt,
                },
            });

            liveImagesService.notifyCollectionsChanged('gql:createCollection');
            return collection;
        },
        updateCollection: async (
            _,
            { id, imageId, title, prompt, negativePrompt }: Partial<Collection>,
        ) => {
            id = Number(id);
            imageId = Number(imageId);

            const collection = await models.collection.update({
                where: {
                    id,
                },
                data: {
                    image: imageId
                        ? {
                              connect: {
                                  id: imageId,
                              },
                          }
                        : undefined,
                    title,
                    prompt,
                    negativePrompt,
                },
            });

            liveImagesService.notifyCollectionsChanged('gql:updateCollection');
            return collection;
        },
        deleteCollection: async (_, { id }: Collection) => {
            id = Number(id);

            const target = await models.collection.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                    imageId: true,
                },
            });

            if (!target) {
                throw new Error('Collection not found');
            }

            await models.collection.delete({
                where: {
                    id: target.id,
                },
            });

            const remains = await models.collection.count({
                where: {
                    imageId: target.imageId,
                },
            });

            if (remains === 0) {
                await liveImagesService.deleteImage(target.imageId);
            } else {
                liveImagesService.notifyCollectionsChanged(
                    'gql:deleteCollection',
                );
            }

            return true;
        },
    },
    Collection: {
        image: (collection: Collection) =>
            models.image.findUnique({
                where: {
                    id: collection.imageId,
                },
            }),
        fileCreatedAt: async (collection: Collection) => {
            const image = await models.image.findUnique({
                where: { id: collection.imageId },
                select: { fileCreatedAt: true },
            });
            return image?.fileCreatedAt?.toISOString?.() || null;
        },
        fileModifiedAt: async (collection: Collection) => {
            const image = await models.image.findUnique({
                where: { id: collection.imageId },
                select: { fileModifiedAt: true },
            });
            return image?.fileModifiedAt?.toISOString?.() || null;
        },
        generatedMetadata: async (collection: Collection) => {
            const metadata = await models.imageMeta.findUnique({
                where: {
                    imageId: collection.imageId,
                },
            });

            if (!metadata) {
                return null;
            }

            let parseWarnings: string[] = [];
            try {
                const parsed = JSON.parse(metadata.parseWarningsJson || '[]');
                if (Array.isArray(parsed)) {
                    parseWarnings = parsed.filter(
                        (item) => typeof item === 'string',
                    );
                }
            } catch {
                parseWarnings = [];
            }

            return {
                sourceType: metadata.sourceType || 'unknown',
                prompt: metadata.prompt || '',
                negativePrompt: metadata.negativePrompt || '',
                model: metadata.model,
                modelHash: metadata.modelHash,
                baseSampler: metadata.baseSampler,
                baseScheduler: metadata.baseScheduler,
                baseSteps: metadata.baseSteps,
                baseCfgScale: metadata.baseCfgScale,
                baseSeed: metadata.baseSeed,
                upscaleSampler: metadata.upscaleSampler,
                upscaleScheduler: metadata.upscaleScheduler,
                upscaleSteps: metadata.upscaleSteps,
                upscaleCfgScale: metadata.upscaleCfgScale,
                upscaleSeed: metadata.upscaleSeed,
                upscaleFactor: metadata.upscaleFactor,
                upscaler: metadata.upscaler,
                sizeWidth: metadata.sizeWidth,
                sizeHeight: metadata.sizeHeight,
                clipSkip: metadata.clipSkip,
                vae: metadata.vae,
                denoiseStrength: metadata.denoiseStrength,
                createdAtFromMeta:
                    metadata.createdAtFromMeta?.toISOString() || null,
                parseWarnings,
                parseVersion: metadata.parseVersion || '',
            };
        },
    },
    AllCollections: {
        collections: async (allCollections: () => Promise<AllCollections>) => {
            const { collections } = await allCollections();
            return collections;
        },
        pagination: async (allCollections: () => Promise<AllCollections>) => {
            const { pagination } = await allCollections();
            return pagination;
        },
    },
};
