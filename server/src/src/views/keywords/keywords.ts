import models from '~/models';
import type { Controller } from '~/types';

export const getKeywords: Controller = async (req, res) => {
    res.send(await models.keyword.findMany({
        select: {
            id: true,
            name: true,
        }
    })).end();
};

export const createKeyword: Controller = async (req, res) => {
    const categoryId = Number(req.body.categoryId);
    const keywordExistsInCategory = await models.keyword.findFirst({
        where: {
            name: req.body.name,
            Categories: {
                some: {
                    id: categoryId,
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

    if (!keywordExists) {
        const keyword = await models.keyword.create({
            data: {
                name: req.body.name,
                Categories: {
                    connect: {
                        id: categoryId,
                    },
                },
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
            Categories: {
                connect: {
                    id: categoryId,
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
            Categories: {
                some: {
                    id: categoryId,
                },
            },
        },
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
            Categories: {
                disconnect: {
                    id: categoryId,
                },
            },
        },
        select: {
            id: true,
            name: true,
            Categories: {
                select: {
                    id: true,
                },
            },
        },
    });

    if (keyword.Categories.length === 0) {
        await models.keyword.delete({
            where: {
                id: keywordId,
            },
        });
    }

    res.status(204).end();
};
