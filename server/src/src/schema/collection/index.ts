import { IResolvers } from '@graphql-tools/utils';

import models, { Collection, Order, Pagination } from '~/models';
import { gql } from '~/modules/graphql';

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
        createdAt: String!
    }
`;

export const CollectionQuery = gql`
    type Query {
        allCollections(orderBy: String, order: String, limit: Int, offset: Int): [Collection!]!
        collection(id: ID!): Collection!
    }
`;

export const CollectionMutation = gql`
    type Mutation {
        createCollection(imageId: ID!, title: String!, prompt: String!, negativePrompt: String!): Collection!
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
        allCollections: (_, { orderBy, order, limit, offset }: Order & Pagination) => models.collection.findMany({
            orderBy: {
                [orderBy || 'createdAt']: order || 'desc',
            },
            take: limit,
            skip: offset,
        }),
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

            return collection;
        },
        deleteCollection: async (_, { id }: Collection) => {
            id = Number(id);

            await models.collection.delete({
                where: {
                    id,
                },
            });

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
};