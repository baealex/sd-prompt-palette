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

describe('Category Schema', () => {
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
        const res = await request(app).post('/graphql').send({
            query: allCategoriesQuery,
        });

        return res.body.data.allCategories;
    };

    it('카테고리 리스트를 반환한다.', async () => {
        const res = await request(app).post('/graphql').send({
            query: allCategoriesQuery,
        });

        expect(res.body.data.allCategories).toHaveLength(2);
    });

    it('카테고리를 생성한다.', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                mutation {
                    createCategory(
                        name: "New Category"
                    ) {
                        id
                        name
                    }
                }
            `,
        });

        expect(res.body.data.createCategory.name).toBe('New Category');
    });

    it('카테고리를 수정한다.', async () => {
        const allCategories = await getAllCategories();

        const res = await request(app).post('/graphql').send({
            query: `
                mutation {
                    updateCategory(
                        id: ${allCategories[0].id},
                        name: "Updated Category"
                    ) {
                        name
                    }
                }
            `,
        });

        expect(res.body.data.updateCategory.name).toBe('Updated Category');
    });

    it('카테고리를 삭제한다 / 카테고리가 존재하지 않는 키워드는 함께 삭제된다.', async () => {
        const allCategories = await getAllCategories();

        const res1 = await request(app).post('/graphql').send({
            query: `
                mutation {
                    deleteCategory(id: ${allCategories[0].id})
                }
            `,
        });

        expect(res1.body.data.deleteCategory).toBe(true);

        const res2 = await request(app).post('/graphql').send({
            query: `
                query {
                    allKeywords {
                        id
                        name
                    }
                }
            `,
        });
        expect(res2.body.data.allKeywords).toHaveLength(2);
    });
});
