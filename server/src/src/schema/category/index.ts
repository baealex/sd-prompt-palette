import { IResolvers } from '@graphql-tools/utils';

import models, { Category } from '~/models';
import { gql } from '~/modules/graphql';
import { keywordType } from '../keyword';

export const categoryType = gql`
    type Category {
        id: ID!
        name: String
        createdAt: String!
        updatedAt: String!
        keywords: [Keyword!]!
    }

    ${keywordType}
`;

export const categoryQuery = gql`
    type Query {
        allCategories: [Category!]!
        category(id: ID!): Category!
    }
`;

export const categoryMutation = gql`
    type Mutation {
        createCategory(name: String!): Category!
        updateCategory(id: ID!, name: String): Category!
        deleteCategory(id: ID!): Boolean!
    }
`;

export const categoryTypeDefs = `
    ${categoryType}
    ${categoryQuery}
    ${categoryMutation}
`;

export const categoryResolvers: IResolvers = {
    Query: {
        allCategories: models.category.findMany,
        category: (_, { id }: Category) => models.category.findUnique({
            where: {
                id: Number(id),
            },
        }),
    },
    Mutation: {
        createCategory: async (_, { name }: Category) => models.category.create({
            data: {
                name,
            },
        }),
        updateCategory: async (_, { id, name }: Category) => models.category.update({
            where: {
                id: Number(id),
            },
            data: {
                name,
            },
        }),
        deleteCategory: async (_, { id }: Category) => {
            await models.keywordToCategory.deleteMany({
                where: {
                    category: {
                        id: Number(id),
                    },
                },
            });
            await models.keyword.deleteMany({
                where: {
                    categories: {
                        none: {}
                    }
                },
            });
            await models.category.delete({
                where: {
                    id: Number(id),
                },
            });

            return true;
        }
    },
    Category: {
        keywords: async (category: Category) => {
            const keywords = await models.keywordToCategory.findMany({
                where: {
                    category: {
                        id: category.id,
                    },
                },
                orderBy: {
                    order: 'asc',
                },
                include: {
                    keyword: true,
                }
            });
            return keywords.map(({ keyword }) => keyword);
        },
    },
};