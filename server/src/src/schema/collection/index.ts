import { IResolvers } from '@graphql-tools/utils';

import models, { Collection, Order, Pagination, Search } from '~/models';
import { gql } from '~/modules/graphql';
import liveImagesService from '~/modules/live-images';

interface AllCollections {
    collections: Collection[];
    pagination: Pagination;
}

export const CollectionType = gql`
    type Collection {
        id: ID!
        image: Image!
        title: String!
        prompt: String!
        negativePrompt: String!
        createdAt: String!
        updatedAt: String!
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
        allCollections: (_, { orderBy, order, query, limit, offset }: Order & Pagination & Search) => async () => {
            const where = query ? {
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
            } : undefined;

            const collections = await models.collection.findMany({
                orderBy: {
                    [orderBy || 'createdAt']: order || 'desc',
                },
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
        collection: (_, { id }: Collection) => models.collection.findUnique({
            where: {
                id: Number(id),
            },
        }),
    },
    Mutation: {
        createCollection: async (_, { imageId, title, prompt, negativePrompt }: Collection) => {
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
        updateCollection: async (_, { id, imageId, title, prompt, negativePrompt }: Partial<Collection>) => {
            id = Number(id);
            imageId = Number(imageId);

            const collection = await models.collection.update({
                where: {
                    id,
                },
                data: {
                    image: imageId ? {
                        connect: {
                            id: imageId,
                        },
                    } : undefined,
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
                liveImagesService.notifyCollectionsChanged('gql:deleteCollection');
            }

            return true;
        },
    },
    Collection: {
        image: (collection: Collection) => models.image.findUnique({
            where: {
                id: collection.imageId,
            },
        }),
    },
    AllCollections: {
        collections: async (allCollections: () => Promise<AllCollections>) => {
            const { collections } = await allCollections();
            return collections;
        },
        pagination: async (allCollections: () => Promise<AllCollections>) => {
            const { pagination } = await allCollections();
            return pagination;
        }
    },
};
