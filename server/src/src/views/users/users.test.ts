import request from 'supertest';

import app from '~/app';
import models from '~/models';

beforeAll(async () => {
    await models.user.create({
        data: {
            name: 'Test User 1',
            email: 'test1@test.test',
            password: '0000',
        },
    });
    await models.user.create({
        data: {
            name: 'Test User 2',
            email: 'test2@test.test',
            password: '0000',
        },
    });
});

describe('GET /user', () => {
    it('return user list', async () => {
        const res = await request(app).get('/api/users');
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).not.toHaveProperty('password');
    });

    it('return user', async () => {
        const res = await request(app).get('/api/users/1');
        expect(res.body.name).toBe('Test User 1');
        expect(res.body).not.toHaveProperty('password');
    });

    it('create user', async () => {
        const res = await request(app).post('/api/users').send({
            name: 'Test User 3',
            email: 'test3@test.test',
            password: 'test3',
        });
        expect(res.body.name).toBe('Test User 3');
        expect(res.body).not.toHaveProperty('password');
    });

    it('update user', async () => {
        const res = await request(app).put('/api/users/1').send({
            name: 'Test User 1 Updated',
        });
        expect(res.body.name).toBe('Test User 1 Updated');
        expect(res.body).not.toHaveProperty('password');
    });

    it('delete user', async () => {
        const res = await request(app).delete('/api/users/1');
        expect(res.status).toBe(204);
        expect(await models.user.findUnique({
            where: {
                id: 1,
            },
        })).toBeNull();
    });
});
