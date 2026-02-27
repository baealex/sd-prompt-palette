import axios from 'axios';

import type { Category, Collection, Keyword } from '~/models/types';

interface GraphQLError {
    message: string;
}

interface GraphQLResponse<T extends string, K> {
    data: {
        [key in T]: K;
    };
    errors?: GraphQLError[];
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

export interface ImageUploadResponse {
    id: number;
    url: string;
    width: number;
    height: number;
    fileCreatedAt?: string | null;
    fileModifiedAt?: string | null;
}

const escapeGraphQLString = (value: string) => value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

export async function graphQLRequest<T extends string, K>(
    query: string,
    variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T, K>> {
    const { data } = await axios.request<GraphQLResponse<T, K>>({
        method: 'POST',
        url: '/graphql',
        data: variables ? { query, variables } : { query },
    });

    if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors.map((error: GraphQLError) => error.message).join('\n'));
    }

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
    return graphQLRequest<'collection', Pick<Collection, 'id' | 'title' | 'prompt' | 'negativePrompt' | 'image' | 'generatedMetadata' | 'fileCreatedAt' | 'fileModifiedAt'>>(
        `
        query($id: ID!) {
            collection(id: $id) {
                id
                title
                prompt
                negativePrompt
                fileCreatedAt
                fileModifiedAt
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
                    createdAtFromMeta
                    parseWarnings
                    parseVersion
                }
            }
        }
        `,
        { id: data.id },
    );
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

    return graphQLRequest<'allCollections', GetCollectionsResponse>(
        `
        query($limit: Int!, $offset: Int!, $query: String!, $order: String!, $orderBy: String!) {
            allCollections(
                limit: $limit,
                offset: $offset,
                query: $query,
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

export function imageUpload(data: { image: string }) {
    return axios.request<ImageUploadResponse>({
        method: 'POST',
        url: '/api/image',
        data,
    });
}

export interface ParsedImageMetadataResponse {
    ok: boolean;
    metadata: {
        prompt: string;
        negativePrompt: string;
        sourceType: 'a1111_parameters' | 'comfy_prompt' | 'exif' | 'unknown';
        model?: string;
        modelHash?: string;
        baseSampler?: string;
        baseScheduler?: string;
        baseSteps?: number;
        baseCfgScale?: number;
        baseSeed?: string;
        upscaleSampler?: string;
        upscaleScheduler?: string;
        upscaleSteps?: number;
        upscaleCfgScale?: number;
        upscaleSeed?: string;
        upscaleFactor?: number;
        upscaler?: string;
        sizeWidth?: number;
        sizeHeight?: number;
        clipSkip?: number;
        vae?: string;
        denoiseStrength?: number;
        createdAtFromMeta?: string;
        parseWarnings: string[];
        parseVersion: string;
    };
}

export function parseImageMetadata(data: { image: string }) {
    return axios.request<ParsedImageMetadataResponse>({
        method: 'POST',
        url: '/api/image/metadata',
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

export interface LiveImageMetadataResponse {
    ok: boolean;
    id: number;
    prompt: string;
    negativePrompt: string;
    sourceType: 'a1111_parameters' | 'comfy_prompt' | 'exif' | 'unknown';
    parseVersion: string;
    warnings: string[];
    metadata: {
        model?: string;
        modelHash?: string;
        baseSampler?: string;
        baseScheduler?: string;
        baseSteps?: number;
        baseCfgScale?: number;
        baseSeed?: string;
        upscaleSampler?: string;
        upscaleScheduler?: string;
        upscaleSteps?: number;
        upscaleCfgScale?: number;
        upscaleSeed?: string;
        upscaleFactor?: number;
        upscaler?: string;
        sizeWidth?: number;
        sizeHeight?: number;
        clipSkip?: number;
        vae?: string;
        denoiseStrength?: number;
        createdAtFromMeta?: string;
    };
}

export function getLiveImageMetadata(data: { id: number }) {
    return axios.request<LiveImageMetadataResponse>({
        method: 'GET',
        url: `/api/live/images/${data.id}/metadata`,
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

export function escapeLegacyGraphQLString(value: string) {
    return escapeGraphQLString(value);
}
