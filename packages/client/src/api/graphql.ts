import type { Category, Collection, Keyword } from '~/models/types';

import { escapeGraphQLString, graphQLRequest } from './graphql-core';

export { graphQLRequest };

export interface OrderRequest {
    order?: 'asc' | 'desc';
    orderBy?: string;
}

export interface SearchRequest {
    query?: string;
    model?: string;
    searchBy?: CollectionSearchBy;
    dateField?: CollectionDateField;
    dateFrom?: string;
    dateTo?: string;
}

export type CollectionSearchBy = 'title' | 'prompt' | 'negative_prompt';
export type CollectionDateField = 'collection_added' | 'generated_at';

export interface PaginationRequest {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface Pagination {
    offset: number;
    limit: number;
    total: number;
}

export function getCategories() {
    return graphQLRequest<'allCategories', Pick<Category, 'id' | 'name' | 'keywords' | 'order'>[]>(`
        query {
            allCategories {
                id
                name
                order
                keywords {
                    id
                    name
                    image {
                        id
                        url
                    }
                    categories {
                        id
                        order
                    }
                }
            }
        }
    `);
}

export function createCategory(data: { name: string }) {
    return graphQLRequest<'createCategory', Pick<Category, 'id' | 'name' | 'order'>>(
        `
        mutation($name: String!) {
            createCategory(name: $name) {
                id
                name
                order
            }
        }
        `,
        { name: data.name },
    );
}

export function updateCategory(data: { id: number; name: string }) {
    return graphQLRequest<'updateCategory', Pick<Category, 'id' | 'name'>>(
        `
        mutation($id: ID!, $name: String!) {
            updateCategory(id: $id, name: $name) {
                id
                name
            }
        }
        `,
        { id: data.id, name: data.name },
    );
}

export function updateCategoryOrder(data: { id: number; order: number }) {
    return graphQLRequest<'updateCategoryOrder', boolean>(
        `
        mutation($id: ID!, $order: Int!) {
            updateCategoryOrder(id: $id, order: $order)
        }
        `,
        { id: data.id, order: data.order },
    );
}

export function deleteCategory(data: { id: number }) {
    return graphQLRequest<'deleteCategory', boolean>(
        `
        mutation($id: ID!) {
            deleteCategory(id: $id)
        }
        `,
        { id: data.id },
    );
}

export function createKeyword(data: { categoryId: number; name: string }) {
    return graphQLRequest<'createKeyword', Pick<Keyword, 'id' | 'name' | 'categories'>>(
        `
        mutation($categoryId: ID!, $name: String!) {
            createKeyword(categoryId: $categoryId, name: $name) {
                id
                name
                categories {
                    id
                    order
                }
            }
        }
        `,
        { categoryId: data.categoryId, name: data.name },
    );
}

export function updateKeywordOrder(data: { keywordId: number; categoryId: number; order: number }) {
    return graphQLRequest<'updateKeywordOrder', boolean>(
        `
        mutation($keywordId: ID!, $categoryId: ID!, $order: Int!) {
            updateKeywordOrder(keywordId: $keywordId, categoryId: $categoryId, order: $order)
        }
        `,
        {
            keywordId: data.keywordId,
            categoryId: data.categoryId,
            order: data.order,
        },
    );
}

export function deleteKeyword(data: { keywordId: number; categoryId: number }) {
    return graphQLRequest<'deleteKeyword', boolean>(
        `
        mutation($keywordId: ID!, $categoryId: ID!) {
            deleteKeyword(keywordId: $keywordId, categoryId: $categoryId)
        }
        `,
        {
            keywordId: data.keywordId,
            categoryId: data.categoryId,
        },
    );
}

export function getCollection(data: { id: number }) {
    return graphQLRequest<'collection', Pick<Collection, 'id' | 'title' | 'prompt' | 'negativePrompt' | 'image' | 'generatedMetadata' | 'generatedAt'>>(
        `
        query($id: ID!) {
            collection(id: $id) {
                id
                title
                prompt
                negativePrompt
                generatedAt
                image {
                    id
                    url
                    width
                    height
                    createdAt
                }
                generatedMetadata {
                    sourceType
                    prompt
                    negativePrompt
                    model
                    modelHash
                    baseSampler
                    baseScheduler
                    baseSteps
                    baseCfgScale
                    baseSeed
                    upscaleSampler
                    upscaleScheduler
                    upscaleSteps
                    upscaleCfgScale
                    upscaleSeed
                    upscaleFactor
                    upscaler
                    sizeWidth
                    sizeHeight
                    clipSkip
                    vae
                    denoiseStrength
                    parseWarnings
                    parseVersion
                }
            }
        }
        `,
        { id: data.id },
    );
}

export function getCollectionModelOptions() {
    return graphQLRequest<'collectionModelOptions', string[]>(`
        query {
            collectionModelOptions
        }
    `);
}

interface GetCollectionsRequestData extends OrderRequest, PaginationRequest, SearchRequest {
    page?: number;
    limit?: number;
}

interface GetCollectionsResponse {
    collections: Pick<Collection, 'id' | 'image' | 'title' | 'prompt' | 'negativePrompt'>[];
    pagination: Pagination;
}

export function getCollections(data: GetCollectionsRequestData = {}) {
    const {
        page = 1,
        limit = 10,
        query = '',
        model = '',
        searchBy = 'title',
        dateField = 'collection_added',
        dateFrom = '',
        dateTo = '',
        order = 'desc',
        orderBy = 'createdAt',
    } = data;
    const offset = (page - 1) * limit;

    return graphQLRequest<'allCollections', GetCollectionsResponse>(
        `
        query(
            $limit: Int!
            $offset: Int!
            $query: String!
            $model: String
            $searchBy: String
            $dateField: String
            $dateFrom: String
            $dateTo: String
            $order: String!
            $orderBy: String!
        ) {
            allCollections(
                limit: $limit,
                offset: $offset,
                query: $query,
                model: $model,
                searchBy: $searchBy,
                dateField: $dateField,
                dateFrom: $dateFrom,
                dateTo: $dateTo,
                order: $order,
                orderBy: $orderBy
            ) {
                collections {
                    id
                    title
                    prompt
                    negativePrompt
                    image {
                        id
                        url
                        width
                        height
                    }
                }
                pagination {
                    offset
                    limit
                    total
                }
            }
        }
        `,
        {
            limit,
            offset,
            query,
            model,
            searchBy,
            dateField,
            dateFrom,
            dateTo,
            order,
            orderBy,
        },
    );
}

export function createCollection(data: { title: string; prompt: string; negativePrompt: string; imageId: number }) {
    return graphQLRequest<'createCollection', Pick<Collection, 'id' | 'prompt' | 'negativePrompt' | 'image'>>(
        `
        mutation($title: String!, $prompt: String!, $negativePrompt: String!, $imageId: ID!) {
            createCollection(title: $title, prompt: $prompt, negativePrompt: $negativePrompt, imageId: $imageId) {
                id
                title
                prompt
                negativePrompt
                image {
                    id
                    url
                    width
                    height
                }
            }
        }
        `,
        {
            title: data.title,
            prompt: data.prompt,
            negativePrompt: data.negativePrompt,
            imageId: data.imageId,
        },
    );
}

export function updateCollection(data: { id: number; title: string }) {
    return graphQLRequest<'updateCollection', Pick<Collection, 'title'>>(
        `
        mutation($id: ID!, $title: String!) {
            updateCollection(id: $id, title: $title) {
                title
            }
        }
        `,
        {
            id: data.id,
            title: data.title,
        },
    );
}

export function deleteCollection(data: { id: number }) {
    return graphQLRequest<'deleteCollection', boolean>(
        `
        mutation($id: ID!) {
            deleteCollection(id: $id)
        }
        `,
        { id: data.id },
    );
}

export function createSampleImage(data: { imageId: number; keywordId: number }) {
    return graphQLRequest<'createSampleImage', boolean>(
        `
        mutation($imageId: ID!, $keywordId: ID!) {
            createSampleImage(imageId: $imageId, keywordId: $keywordId) {
                id
                name
                image {
                    id
                    url
                }
            }
        }
        `,
        {
            imageId: data.imageId,
            keywordId: data.keywordId,
        },
    );
}

export function deleteSampleImage(data: { id: number }) {
    return graphQLRequest<'deleteSampleImage', boolean>(
        `
        mutation($id: ID!) {
            deleteSampleImage(id: $id)
        }
        `,
        { id: data.id },
    );
}

export function escapeLegacyGraphQLString(value: string) {
    return escapeGraphQLString(value);
}
