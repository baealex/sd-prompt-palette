import axios from 'axios';
import { Category, Collection, Keyword } from '~/models/types';

interface GraphqlResponse<T extends string, K> {
    data: {
        [key in T]: K;
    };
}

export interface Order {
    orderBy?: string;
    order?: 'asc' | 'desc';
}

export interface Pagination {
    limit?: number;
    page?: number;
}

export async function graphQLRequest<T extends string, K>(query: string): Promise<GraphqlResponse<T, K>> {
    const { data } = await axios.request<GraphqlResponse<T, K>>({
        method: 'POST',
        url: '/graphql',
        data: {
            query,
        },
    });
    return data;
}

export function getCategories() {
    return graphQLRequest<'allCategories', Pick<Category, 'id' | 'name' | 'keywords'>[]>(`
        query {
            allCategories {
                id
                name
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
    return graphQLRequest<'createCategory', Pick<Category, 'id' | 'name'>>(`
        mutation {
            createCategory(name: "${data.name}") {
                id
                name
            }
        }
    `);
}

export function updateCategory(data: { id: number, name: string }) {
    return graphQLRequest<'updateCategory', Pick<Category, 'id' | 'name'>>(`
        mutation {
            updateCategory(id: ${data.id}, name: "${data.name}") {
                id
                name
            }
        }
    `);
}

export function deleteCategory(data: { id: number }) {
    return graphQLRequest<'deleteCategory', boolean>(`
        mutation {
            deleteCategory(id: ${data.id})
        }
    `);
}

export function createKeyword(data: { categoryId: number; name: string }) {
    return graphQLRequest<'createKeyword', Pick<Keyword, 'id' | 'name' | 'categories'>>(`
        mutation {
            createKeyword(categoryId: ${data.categoryId}, name: "${data.name}") {
                id
                name
                categories {
                    id
                    order
                }
            }
        }
    `);
}

export function updateKeywordOrder(data: { keywordId: number, categoryId: number, order: number }) {
    return graphQLRequest<'updateKeywordOrder', boolean>(`
        mutation {
            updateKeywordOrder(keywordId: ${data.keywordId}, categoryId: ${data.categoryId}, order: ${data.order})
        }
    `);
}

export function deleteKeyword(data: { keywordId: number, categoryId: number }) {
    return graphQLRequest<'deleteKeyword', boolean>(`
        mutation {
            deleteKeyword(keywordId: ${data.keywordId}, categoryId: ${data.categoryId})
        }
    `);
}

export function getCollections(data: Order & Pagination = {}) {
    const {
        page = 1,
        limit = 10,
        order = 'desc',
        orderBy = 'createdAt',
    } = data;
    const offset = (page - 1) * limit;

    return graphQLRequest<'allCollections', Pick<Collection, 'id' | 'image' | 'title' | 'prompt' | 'negativePrompt'>[]>(`
        query {
            allCollections(
                limit: ${limit},
                offset: ${offset},
                orderBy: "${orderBy}",
                order: "${order}"
            ) {
                id
                title
                prompt
                negativePrompt
                image {
                    id
                    url
                }
            }
        }
    `);
}

export function createCollection(data: { title: string, prompt: string, negativePrompt: string, imageId: number }) {
    return graphQLRequest<'createCollection', Pick<Collection, 'id' | 'prompt' | 'negativePrompt' | 'image'>>(`
        mutation {
            createCollection(title: "${data.title}", prompt: "${data.prompt}", negativePrompt: "${data.negativePrompt}", imageId: ${data.imageId}) {
                id
                title
                prompt
                negativePrompt
                image {
                    id
                    url
                }
            }
        }
    `);
}

export function deleteCollection(data: { id: number }) {
    return graphQLRequest<'deleteCollection', boolean>(`
        mutation {
            deleteCollection(id: ${data.id})
        }
    `);
}

export function createSampleImage(data: { imageId: number, keywordId: number }) {
    return graphQLRequest<'createSampleImage', boolean>(`
        mutation {
            createSampleImage(imageId: ${data.imageId}, keywordId: ${data.keywordId}) {
                id
                name
                image {
                    id
                    url
                }
            }
        }
    `);
}

export function deleteSampleImage(data: { id: number }) {
    return graphQLRequest<'deleteSampleImage', boolean>(`
        mutation {
            deleteSampleImage(id: ${data.id})
        }
    `);
}

export function imageUpload(data: { image: string }) {
    return axios.request<{ id: number, url: string }>({
        method: 'POST',
        url: '/api/image',
        data,
    });
}