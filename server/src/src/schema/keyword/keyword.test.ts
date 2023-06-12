import request from 'supertest';

import app from '~/app';
import models from '~/models';

beforeAll(async () => {
    const colorCategory = await models.category.create({
        data: {
            name: 'Color',
        },
    });
    await models.keyword.create({
        data: {
            name: 'Red',
            categories: {
                create: {
                    order: 1,
                    category: {
                        connect: {
                            id: colorCategory.id,
                        }
                    }
                }
            }
        },
    });
    await models.keyword.create({
        data: {
            name: 'Blue',
            categories: {
                create: {
                    order: 2,
                    category: {
                        connect: {
                            id: colorCategory.id,
                        }
                    }
                }
            }
        },
    });
    const themeCategory = await models.category.create({
        data: {
            name: 'Theme',
        },
    });
    await models.keyword.create({
        data: {
            name: 'Light',
            categories: {
                create: {
                    order: 1,
                    category: {
                        connect: {
                            id: themeCategory.id,
                        }
                    }
                }
            }
        },
    });
    await models.keyword.create({
        data: {
            name: 'Dark',
            categories: {
                create: {
                    order: 2,
                    category: {
                        connect: {
                            id: themeCategory.id,
                        }
                    }
                }
            }
        },
    });
});

afterAll(async () => {
    await models.keywordToCategory.deleteMany();
    await models.category.deleteMany();
    await models.keyword.deleteMany();
});

describe('Keyword Schema', () => {
    const allCategoriesQuery = `
        query {
            allCategories {
                id
                name
                keywords {
                    id
                    name
                    categories {
                        id
                        order
                    }
                }
            }
        }       
    `;

    const getAllCategories = async () => {
        const res = await request(app).get('/graphql').send({
            query: allCategoriesQuery,
        });

        return res.body.data.allCategories;
    };

    const getAllKeywords = async () => {
        const allCategories = await getAllCategories();

        return allCategories.reduce((acc, cur) => {
            return acc.concat(cur.keywords);
        }, []);
    };

    it('키워드 리스트를 반환한다.', async () => {
        const response = await request(app).post('/graphql').send({
            query: `
                query {
                    allKeywords {
                        id
                        name
                        categories {
                            id
                            order
                        }
                    }
                }
            `,
        });

        expect(response.body.data.allKeywords).toHaveLength(4);
    });

    it('키워드를 생성한다.', async () => {
        const allCategories = await getAllCategories();

        const response = await request(app).post('/graphql').send({
            query: `
                mutation {
                    createKeyword(name: "Green", categoryId: "${allCategories[0].id}") {
                        id
                        name
                        categories {
                            id
                            order
                        }
                    }
                }
            `,
        });

        expect(response.body.data.createKeyword).toHaveProperty('id');
        expect(response.body.data.createKeyword).toHaveProperty('name');
        expect(response.body.data.createKeyword.categories).toHaveLength(1);
    });

    it('키워드를 삭제한다', async () => {
        const allCategories = await getAllCategories();
        const allKeywords = await getAllKeywords();

        const response = await request(app).post('/graphql').send({
            query: `
                mutation {
                    deleteKeyword(categoryId: "${allCategories[0].id}", keywordId: "${allKeywords[0].id}")
                }
            `,
        });

        expect(response.body.data.deleteKeyword).toBe(true);
    });

    it('카테고리가 남아있는 키워드는 삭제되지 않는다.', async () => {
        const allCategories = await getAllCategories();

        const dataX = await models.keyword.create({
            data: {
                name: 'X',
                categories: {
                    create: {
                        order: 998,
                        category: {
                            connect: {
                                id: Number(allCategories[0].id),
                            }
                        }
                    }
                }
            },
        });
        await models.keyword.update({
            where: {
                id: dataX.id,
            },
            data: {
                categories: {
                    create: {
                        order: 999,
                        category: {
                            connect: {
                                id: Number(allCategories[1].id),
                            }
                        }
                    }
                }
            },
        });

        await request(app).post('/graphql').send({
            query: `
                mutation {
                    deleteKeyword(categoryId: "${allCategories[0].id}", keywordId: "${dataX.id}")
                }
            `,
        });

        const allKeywords = await getAllKeywords();
        expect(allKeywords.find((keyword) => keyword.id === dataX.id)).not.toBeNull();
    });
});
