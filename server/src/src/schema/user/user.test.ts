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

afterAll(async () => {
    await models.user.deleteMany();
});

describe('User Schema', () => {
    it('return user list', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                query {
                    allUsers {
                        id
                        name
                        email
                        createdAt
                        updatedAt
                    }
                }
            `,
        });

        expect(res.body.data.allUsers).toHaveLength(2);
    });

    it('can not return password', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                query {
                    allUsers {
                        id
                        name
                        email
                        password
                        createdAt
                        updatedAt
                    }
                }
            `,
        });

        expect(res.status).toBe(200);
        expect(res.body.errors[0].message).toContain('Cannot query field "password"');
    });

    it('return user', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                query {
                    user(id: 1) {
                        id
                        name
                        email
                        createdAt
                        updatedAt
                    }
                }
            `,
        });

        expect(res.body.data.user.name).toBe('Test User 1');
    });

    it('create user', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                mutation {
                    createUser(
                        name: "Test User 3"
                        email: "test3@test.test"
                        password: "test3"
                    ) {
                        id
                        name
                        email
                        createdAt
                        updatedAt
                    }
                }
            `,
        });

        expect(res.body.data.createUser.name).toBe('Test User 3');
    });

    it('update user', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                mutation {
                    updateUser(
                        id: 1
                        name: "Test User 1 Updated"
                    ) {
                        id
                        name
                        email
                        createdAt
                        updatedAt
                    }
                }
            `,
        });

        expect(res.body.data.updateUser.name).toBe('Test User 1 Updated');
    });

    it('delete user', async () => {
        const res = await request(app).post('/graphql').send({
            query: `
                mutation {
                    deleteUser(id: 1)
                }
            `,
        });

        expect(res.body.data.deleteUser).toBe(true);
    });
});
