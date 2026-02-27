import { IResolvers } from '@graphql-tools/utils';

import { Keyword, KeywordToCategory, models } from '~/models';
import { gql } from '~/modules/graphql';

export const keywordType = gql`
    type Keyword {
        id: ID!
        name: String
        image: Image
        createdAt: String!
        updatedAt: String!
        categories: [keywordToCategory!]!
    }

    type Image {
        id: ID!
        url: String!
        width: Int!
        height: Int!
    }

    type keywordToCategory {
        id: ID!
        order: Int!
        keywordId: Int!
        categoryId: Int!
    }
`;

export const keywordQuery = gql`
    type Query {
        allKeywords: [Keyword!]!
        keyword(id: ID!): Keyword!
    }
`;

export const keywordMutation = gql`
    type Mutation {
        createKeyword(name: String!, categoryId: ID!): Keyword!
        createSampleImage(imageId: ID!, keywordId: ID!): Keyword!
        updateKeywordOrder(categoryId: ID!, keywordId: ID!, order: Int!): Boolean!
        deleteKeyword(categoryId: ID!, keywordId: ID!): Boolean!
        deleteSampleImage(id: ID!): Boolean!
    }
`;

export const keywordTypeDefs = `
    ${keywordType}
    ${keywordQuery}
    ${keywordMutation}
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

export const keywordResolvers: IResolvers = {
    Query: {
        allKeywords: models.keyword.findMany,
        keyword: (_, { id }: Keyword) =>
            models.keyword.findUnique({
                where: {
                    id: Number(id),
                },
            }),
    },
    Mutation: {
        createKeyword: async (
            _,
            { name, categoryId }: Keyword & KeywordToCategory,
        ) => {
            categoryId = Number(categoryId);

            const keyword = await models.keyword.findFirst({
                where: {
                    name,
                },
                select: {
                    id: true,
                    categories: {
                        select: {
                            categoryId: true,
                        },
                    },
                },
            });

            if (
                keyword?.categories?.some(
                    (category) => category.categoryId === categoryId,
                )
            ) {
                throw new Error('Keyword already exists in category');
            }

            const nextOrder = await models.keywordToCategory.findFirst({
                where: {
                    categoryId,
                },
                orderBy: {
                    order: 'desc',
                },
            });

            if (keyword) {
                return models.keyword.update({
                    where: {
                        id: keyword.id,
                    },
                    data: {
                        categories: {
                            create: {
                                order: nextOrder ? nextOrder.order + 1 : 1,
                                category: {
                                    connect: {
                                        id: categoryId,
                                    },
                                },
                            },
                        },
                    },
                });
            }

            return models.keyword.create({
                data: {
                    name,
                    categories: {
                        create: {
                            order: nextOrder ? nextOrder.order + 1 : 1,
                            category: {
                                connect: {
                                    id: categoryId,
                                },
                            },
                        },
                    },
                },
            });
        },
        createSampleImage: async (
            _,
            { imageId, keywordId }: { imageId: number; keywordId: number },
        ) => {
            keywordId = Number(keywordId);
            imageId = Number(imageId);

            const keywordExists = await models.keyword.findFirst({
                where: {
                    id: keywordId,
                },
                select: {
                    id: true,
                },
            });

            if (!keywordExists) {
                throw new Error('Keyword does not exist');
            }

            const imageExists = await models.image.findFirst({
                where: {
                    id: imageId,
                },
                select: {
                    id: true,
                },
            });

            if (!imageExists) {
                throw new Error('Image does not exist');
            }

            return models.keyword.update({
                where: {
                    id: keywordId,
                },
                data: {
                    image: {
                        connect: {
                            id: imageId,
                        },
                    },
                },
            });
        },
        updateKeywordOrder: async (
            _,
            { categoryId, keywordId, order }: KeywordToCategory,
        ) => {
            const parsedCategoryId = Number(categoryId);
            const parsedKeywordId = Number(keywordId);
            const targetOrder = Number(order);

            const keywords = await models.keywordToCategory.findMany({
                where: {
                    categoryId: parsedCategoryId,
                },
                orderBy: {
                    order: 'asc',
                },
            });

            const fromIndex = keywords.findIndex(
                (keyword) => keyword.keywordId === parsedKeywordId,
            );
            if (fromIndex < 0) {
                throw new Error('Keyword does not exist in category');
            }

            const toIndex = clampOrderToIndex(targetOrder, keywords.length);
            if (fromIndex === toIndex) {
                return true;
            }

            const reordered = [...keywords];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);

            await models.$transaction(
                reordered.map((keyword, index) =>
                    models.keywordToCategory.update({
                        where: {
                            id: keyword.id,
                        },
                        data: {
                            order: index + 1,
                        },
                    }),
                ),
            );

            return true;
        },
        deleteKeyword: async (
            _,
            { categoryId, keywordId }: KeywordToCategory,
        ) => {
            categoryId = Number(categoryId);
            keywordId = Number(keywordId);

            const keywordExists = await models.keyword.findFirst({
                where: {
                    id: keywordId,
                    categories: {
                        some: {
                            categoryId: categoryId,
                        },
                    },
                },
                select: {
                    categories: {
                        select: {
                            id: true,
                            category: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!keywordExists) {
                throw new Error('Keyword does not exist in category');
            }

            const keyword = await models.keyword.update({
                where: {
                    id: keywordId,
                },
                data: {
                    categories: {
                        delete: {
                            id: keywordExists.categories.find(
                                ({ category }) => category.id === categoryId,
                            ).id,
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    categories: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (keyword.categories.length === 0) {
                await models.keyword.delete({
                    where: {
                        id: keywordId,
                    },
                });
            }

            return true;
        },
        deleteSampleImage: async (_, { id }: Keyword) => {
            id = Number(id);

            const keyword = await models.keyword.findFirst({
                where: {
                    id,
                },
                select: {
                    id: true,
                    image: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (!keyword) {
                throw new Error('Keyword does not exist');
            }

            if (!keyword.image) {
                throw new Error('Keyword does not have an image');
            }

            await models.keyword.update({
                where: {
                    id,
                },
                data: {
                    image: {
                        disconnect: true,
                    },
                },
            });

            return true;
        },
    },
    Keyword: {
        categories: (keyword: Keyword) =>
            models.keywordToCategory.findMany({
                where: {
                    keywordId: keyword.id,
                },
            }),
        image: (keyword: Keyword) =>
            models.image.findFirst({
                where: {
                    keywords: {
                        some: {
                            id: keyword.id,
                        },
                    },
                },
            }),
    },
};
