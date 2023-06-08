import models from '~/models';
import { createPasswordHash } from '~/modules/auth';
import type { Controller } from '~/types';

export const getUsers: Controller = async (req, res) => {
    res.send(await models.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
        }
    })).end();
};

export const getUser: Controller = async (req, res) => {
    res.send(await models.user.findUnique({
        where: {
            id: Number(req.params.id),
        },
        select: {
            id: true,
            name: true,
            email: true,
        }
    })).end();
};

export const createUser: Controller = async (req, res) => {
    const user = await models.user.create({
        data: {
            ...req.body,
            password: await createPasswordHash(req.body.password),
        },
        select: {
            id: true,
            name: true,
            email: true,
        }
    });
    res.send(user).end();
};

export const updateUser: Controller = async (req, res) => {
    const user = await models.user.update({
        where: {
            id: Number(req.params.id),
        },
        data: req.body,
        select: {
            id: true,
            name: true,
            email: true,
        }
    });
    res.send(user).end();
};

export const deleteUser: Controller = async (req, res) => {
    await models.user.delete({
        where: {
            id: Number(req.params.id),
        },
    });
    res.status(204).end();
};
