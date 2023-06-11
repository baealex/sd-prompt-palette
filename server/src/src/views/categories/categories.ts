import models from '~/models';
import type { Controller } from '~/types';

export const getCategories: Controller = async (req, res) => {
    res.send(await models.category.findMany({
        select: {
            id: true,
            name: true,
            keywords: {
                select: {
                    order: true,
                    keyword: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                },
            },
        },
        orderBy: {
            id: 'asc',
        }
    })).end();
};

export const createCategory: Controller = async (req, res) => {
    const category = await models.category.create({
        data: {
            ...req.body,
        },
        select: {
            id: true,
            name: true,
        }
    });
    res.send(category).end();
};

export const updateCategory: Controller = async (req, res) => {
    const category = await models.category.update({
        where: {
            id: Number(req.params.id),
        },
        data: {
            ...req.body,
        },
        select: {
            name: true,
        }
    });
    res.send(category).end();
};

export const deleteCategory: Controller = async (req, res) => {
    const categoryId = Number(req.params.id);

    await models.keywordToCategory.deleteMany({
        where: {
            category: {
                id: categoryId,
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
            id: categoryId,
        },
    });
    res.status(204).end();
};