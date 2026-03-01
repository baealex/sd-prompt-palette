import { IResolvers } from '@graphql-tools/utils';

import { Category, models } from '~/models';
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

const clampOrderToIndex = (order: number, length: number) => {
    if (length <= 0) {
        return 0;
    }
    if (order <= 1) {
        return 0;
    }
    if (order >= length) {
        return length - 1;
    }
    return order - 1;
};

export const categoryResolvers: IResolvers = {
    Query: {
        allCategories: () => {
            return models.category.findMany({
                orderBy: {
                    order: 'asc',
                },
            });
        },
        category: (_, { id }: Category) =>
            models.category.findUnique({
                where: {
                    id: Number(id),
                },
            }),
    },
    Mutation: {
        createCategory: async (_, { name }: Category) => {
            return models.$transaction(async (tx) => {
                const categories = await tx.category.findMany({
                    orderBy: {
                        order: 'desc',
                    },
                });

                for (const category of categories) {
                    await tx.category.update({
                        where: {
                            id: category.id,
                        },
                        data: {
                            order: category.order + 1,
                        },
                    });
                }

                return tx.category.create({
                    data: {
                        name,
                        order: 1,
                    },
                });
            });
        },
        updateCategory: async (_, { id, name }: Category) =>
            models.category.update({
                where: {
                    id: Number(id),
                },
                data: {
                    name,
                },
            }),
        updateCategoryOrder: async (_, { id, order }: Category) => {
            const categoryId = Number(id);
            const targetOrder = Number(order);

            const categories = await models.category.findMany({
                orderBy: {
                    order: 'asc',
                },
            });

            const fromIndex = categories.findIndex(
                (category) => category.id === categoryId,
            );
            if (fromIndex < 0) {
                throw new Error('Category does not exist');
            }

            const toIndex = clampOrderToIndex(targetOrder, categories.length);
            if (fromIndex === toIndex) {
                return true;
            }

            const reordered = [...categories];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);

            await models.$transaction(
                reordered.map((category, index) =>
                    models.category.update({
                        where: {
                            id: category.id,
                        },
                        data: {
                            order: index + 1,
                        },
                    }),
                ),
            );

            return true;
        },
        deleteCategory: async (_, { id }: Category) => {
            await models.$transaction(async (tx) => {
                await tx.keywordToCategory.deleteMany({
                    where: {
                        category: {
                            id: Number(id),
                        },
                    },
                });

                await tx.keyword.deleteMany({
                    where: {
                        categories: {
                            none: {},
                        },
                    },
                });

                await tx.category.delete({
                    where: {
                        id: Number(id),
                    },
                });

                const categories = await tx.category.findMany({
                    orderBy: { order: 'asc' },
                });

                for (let index = 0; index < categories.length; index += 1) {
                    const category = categories[index];
                    await tx.category.update({
                        where: {
                            id: category.id,
                        },
                        data: {
                            order: index + 1,
                        },
                    });
                }
            });

            return true;
        },
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
                },
            });
            return keywords.map(({ keyword }) => keyword);
        },
    },
};
