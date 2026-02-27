import axios from 'axios';
import type { Category, Collection, Keyword } from '../models/types';

interface GraphqlResponse<T extends string, K> {
    data: {
        [key in T]: K;
    };
}

export interface OrderRequest {
    order?: 'asc' | 'desc';
    orderBy?: string;
}

export interface SearchRequest {
    query?: string;
}

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
    return graphQLRequest<'createCategory', Pick<Category, 'id' | 'name' | 'order'>>(`
        mutation {
            createCategory(name: "${data.name}") {
                id
                name
                order
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

export function updateCategoryOrder(data: { id: number, order: number }) {
    return graphQLRequest<'updateCategoryOrder', boolean>(`
        mutation {
            updateCategoryOrder(id: ${data.id}, order: ${data.order})
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

export function getCollection(data: { id: number }) {
    return graphQLRequest<'collection', Pick<Collection, 'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'>>(`
        query {
            collection(id: ${data.id}) {
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
        order = 'desc',
        orderBy = 'createdAt',
    } = data;
    const offset = (page - 1) * limit;

    return graphQLRequest<'allCollections', GetCollectionsResponse>(`
        query {
            allCollections(
                limit: ${limit},
                offset: ${offset},
                query: "${query}",
                order: "${order}"
                orderBy: "${orderBy}",
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
    return axios.request<{ id: number, url: string, width: number, height: number }>({
        method: 'POST',
        url: '/api/image',
        data,
    });
}

export interface LiveStatusResponse {
    ok: boolean;
    config?: LiveConfig;
    watchDir: string;
    libraryDir: string;
    ingestMode: 'copy' | 'move';
    deleteSourceOnDelete?: boolean;
    enabled?: boolean;
    watchersRunning?: boolean;
    initialized: boolean;
    updatedAt?: number;
}

export interface LiveConfig {
    watchDir: string;
    ingestMode: 'copy' | 'move';
    deleteSourceOnDelete: boolean;
    enabled: boolean;
    updatedAt: number;
}

export interface LiveConfigResponse {
    ok: boolean;
    config: LiveConfig;
    status: LiveStatusResponse;
}

export interface LiveImage {
    id: number;
    name: string;
    url: string;
    width: number;
    height: number;
    createdAt: number;
}

export interface LiveImagesResponse {
    ok: boolean;
    reason?: string;
    updatedAt: number;
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    images: LiveImage[];
}

export interface LiveDirectoryEntry {
    name: string;
    path: string;
}

export interface LiveDirectoriesResponse {
    ok: boolean;
    currentPath?: string;
    parentPath?: string | null;
    roots?: string[];
    directories?: LiveDirectoryEntry[];
    message?: string;
}

export function getLiveStatus() {
    return axios.request<LiveStatusResponse>({
        method: 'GET',
        url: '/api/live/status',
    });
}

export function getLiveConfig() {
    return axios.request<LiveConfigResponse>({
        method: 'GET',
        url: '/api/live/config',
    });
}

export function updateLiveConfig(data: Partial<LiveConfig>) {
    return axios.request<LiveConfigResponse>({
        method: 'PUT',
        url: '/api/live/config',
        data,
    });
}

export function listLiveDirectories(data: { path?: string } = {}) {
    return axios.request<LiveDirectoriesResponse>({
        method: 'GET',
        url: '/api/live/config/directories',
        params: data.path ? { path: data.path } : undefined,
    });
}

export function pickLiveDirectory() {
    return axios.request<{ ok: boolean; path?: string; canceled?: boolean; message?: string }>({
        method: 'POST',
        url: '/api/live/config/pick-dir',
    });
}

export function getLiveImages(data: { page?: number; limit?: number } = {}) {
    return axios.request<LiveImagesResponse>({
        method: 'GET',
        url: '/api/live/images',
        params: data,
    });
}

export function getLiveImagePrompt(data: { id: number }) {
    return axios.request<{ ok: boolean; id: number; prompt: string }>({
        method: 'GET',
        url: `/api/live/images/${data.id}/prompt`,
    });
}

export function deleteLiveImage(data: { id: number }) {
    return axios.request<{ ok: boolean }>({
        method: 'DELETE',
        url: `/api/live/images/${data.id}`,
    });
}

export function syncLiveImages() {
    return axios.request<{ ok: boolean; scanned: number }>({
        method: 'POST',
        url: '/api/live/sync',
    });
}
