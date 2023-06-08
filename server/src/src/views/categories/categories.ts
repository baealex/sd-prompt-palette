import models from '~/models';
import type { Controller } from '~/types';

export const getCategories: Controller = async (req, res) => {
    res.send(await models.category.findMany({
        select: {
            id: true,
            name: true,
            Keywords: true,
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
    await models.category.delete({
        where: {
            id: Number(req.params.id),
        },
    });
    res.status(204).end();
};