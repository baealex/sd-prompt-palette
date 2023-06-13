import { IResolvers } from '@graphql-tools/utils';

import models, { Collection } from '~/models';
import { gql } from '~/modules/graphql';

export const CollectionType = gql`
    type Collection {
        id: ID!
        image: Image!
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
        allCollections: [Collection!]!
        collection(id: ID!): Collection!
    }
`;

export const CollectionMutation = gql`
    type Mutation {
        createCollection(imageId: ID!, prompt: String!, negativePrompt: String!): Collection!
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
        allCollections: models.collection.findMany,
        collection: (_, { id }: Collection) => models.collection.findUnique({
            where: {
                id: Number(id),
            },
        }),
    },
    Mutation: {
        createCollection: async (_, { imageId, prompt, negativePrompt }: Collection) => {
            imageId = Number(imageId);

            const collection = await models.collection.create({
                data: {
                    image: {
                        connect: {
                            id: imageId,
                        },
                    },
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
    }
};