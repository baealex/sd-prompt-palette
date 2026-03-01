import { PrismaClient } from '@prisma/client';

const mockPrisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:test.sqlite3',
        },
    },
});

jest.mock('~/models', () => {
    const actual = jest.requireActual('~/models') as Record<string, unknown>;
    return {
        ...actual,
        models: mockPrisma,
    };
});

beforeAll(async () => {
    await mockPrisma.$connect();
});

afterAll(async () => {
    await mockPrisma.$disconnect();
});
