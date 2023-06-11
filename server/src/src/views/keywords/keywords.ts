import models from '~/models';
import type { Controller } from '~/types';

export const getKeywords: Controller = async (req, res) => {
    res.send(await models.keyword.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            id: 'asc',
        }
    })).end();
};

export const createKeyword: Controller = async (req, res) => {
    const categoryId = Number(req.body.categoryId);
    const keywordExistsInCategory = await models.keyword.findFirst({
        where: {
            name: req.body.name,
            categories: {
                some: {
                    category: {
                        id: categoryId,
                    },
                },
            },
        },
    });

    if (keywordExistsInCategory) {
        res.status(409).end();
        return;
    }

    const keywordExists = await models.keyword.findFirst({
        where: {
            name: req.body.name,
        },
    });

    const lastOrder = await models.keywordToCategory.findFirst({
        where: {
            category: {
                id: categoryId,
            },
        },
        orderBy: {
            order: 'desc',
        },
        select: {
            order: true,
        },
    });

    if (!keywordExists) {
        const keyword = await models.keyword.create({
            data: {
                name: req.body.name,
                categories: {
                    create: {
                        order: (lastOrder?.order || 0) + 1,
                        category: {
                            connect: {
                                id: categoryId,
                            },
                        },
                    },
                }
            },
            select: {
                id: true,
                name: true,
            },
        });
        res.send(keyword).end();
        return;
    }

    const keyword = await models.keyword.update({
        where: {
            id: keywordExists.id,
        },
        data: {
            categories: {
                create: {
                    order: (lastOrder?.order || 0) + 1,
                    category: {
                        connect: {
                            id: categoryId,
                        },
                    },
                },
            },
        },
        select: {
            id: true,
            name: true,
        },
    });
    res.send(keyword).end();
};

export const deleteKeyword: Controller = async (req, res) => {
    const keywordId = Number(req.params.id);
    const categoryId = Number(req.body.categoryId);

    const keywordExists = await models.keyword.findFirst({
        where: {
            id: keywordId,
            categories: {
                some: {
                    categoryId,
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
        res.status(404).end();
        return;
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

    res.status(204).end();
};
