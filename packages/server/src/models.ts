import { PrismaClient } from "@prisma/client";

export const models = new PrismaClient();

export interface Order {
	orderBy: string;
	order: "asc" | "desc";
}

export interface Search {
	query: string;
	model?: string;
	searchBy?: "title" | "prompt" | "negative_prompt";
	dateField?: "collection_added" | "generated_at";
	dateFrom?: string;
	dateTo?: string;
}

export interface Pagination {
	limit: number;
	offset: number;
}

export * from "@prisma/client";
