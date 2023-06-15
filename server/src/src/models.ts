import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Order {
    orderBy: string;
    order: 'asc' | 'desc';
}

export interface Pagination {
    limit: number;
    offset: number;
}

export default prisma;
export * from '@prisma/client';
