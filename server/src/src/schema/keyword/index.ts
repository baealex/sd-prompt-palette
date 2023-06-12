import { IResolvers } from '@graphql-tools/utils';

import models, { Keyword, KeywordToCategory } from '~/models';
import { gql } from '~/modules/graphql';

export const keywordType = gql`
    type Keyword {
        id: ID!
        name: String
        createdAt: String!
        updatedAt: String!
        categories: [keywordToCategory!]!
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
        deleteKeyword(categoryId: ID!, keywordId: ID!): Boolean!
    }
`;

export const keywordTypeDefs = `
    ${keywordType}
    ${keywordQuery}
    ${keywordMutation}
`;

export const keywordResolvers: IResolvers = {
    Query: {
        allKeywords: models.keyword.findMany,
        keyword: (_, { id }: Keyword) => models.keyword.findUnique({
            where: {
                id: Number(id),
            },
        }),
    },
    Mutation: {
        createKeyword: async (_, { name, categoryId }: Keyword & KeywordToCategory) => {
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

            if (keyword?.categories?.some((category) => category.categoryId === categoryId)) {
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
                                    }
                                },
                            },
                        }
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
                    }
                },
            });
        },
        deleteKeyword: async (_, { categoryId, keywordId }: KeywordToCategory) => {
            categoryId = Number(categoryId);
            keywordId = Number(keywordId);

            const keywordExists = await models.keyword.findFirst({
                where: {
                    id: keywordId,
                    categories: {
                        some: {
                            categoryId: categoryId,
                        }
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
                            }
                        },
                    },
                }
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
                            id: keywordExists.categories
                                .find(({ category }) => category.id === categoryId).id,
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
        }
    },
    Keyword: {
        categories: (keyword: Keyword) => models.keywordToCategory.findMany({
            where: {
                keywordId: keyword.id,
            },
        }),
    },
};