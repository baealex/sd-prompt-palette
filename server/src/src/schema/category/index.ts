import { IResolvers } from '@graphql-tools/utils';

import models, { Category } from '~/models';
import { gql } from '~/modules/graphql';
import { keywordType } from '../keyword';

export const categoryType = gql`
    type Category {
        id: ID!
        name: String
        order: Int!
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
        updateCategoryOrder(id: ID!, order: Int!): Boolean!
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
        allCategories: () => {
            return models.category.findMany({
                orderBy: {
                    order: 'asc',
                },
            });
        },
        category: (_, { id }: Category) => models.category.findUnique({
            where: {
                id: Number(id),
            },
        }),
    },
    Mutation: {
        createCategory: async (_, { name }: Category) => {
            const categories = await models.category.findMany({
                orderBy: {
                    order: 'desc',
                },
            });
            for (const category of categories) {
                await models.category.update({
                    where: {
                        id: category.id,
                    },
                    data: {
                        order: category.order + 1,
                    },
                });
            }
            return models.category.create({
                data: {
                    name,
                    order: 1,
                },
            });
        },
        updateCategory: async (_, { id, name }: Category) => models.category.update({
            where: {
                id: Number(id),
            },
            data: {
                name,
            },
        }),
        updateCategoryOrder: async (_, { id, order }: Category) => {
            id = Number(id);

            const categories = await models.category.findMany({
                orderBy: {
                    order: 'asc',
                },
            });

            let idx = 1;
            for (const category of categories) {
                if (category.id === id) {
                    await models.category.update({
                        where: {
                            id,
                        },
                        data: {
                            order,
                        },
                    });
                } else {
                    if (idx === order) {
                        idx += 1;
                    }
                    await models.category.update({
                        where: {
                            id: category.id,
                        },
                        data: {
                            order: idx,
                        },
                    });
                    idx += 1;
                }
            }

            return true;
        },
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
            const categories = await models.category.findMany({
                orderBy: {
                    order: 'desc',
                },
            });
            for (const category of categories) {
                await models.category.update({
                    where: {
                        id: category.id,
                    },
                    data: {
                        order: category.order - 1,
                    },
                });
            }

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