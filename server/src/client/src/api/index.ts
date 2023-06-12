import axios from 'axios';

interface KeywordToCategory {
    id: number;
    order: number;
}

interface Keyword {
    id: number;
    name: string;
    categories: KeywordToCategory[];
}

interface Category {
    id: number;
    name: string;
    keywords: Keyword[];
}

interface GraphqlResponse<T extends string, K> {
    data: {
        [key in T]: K;
    };
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

export function deleteKeyword(data: { keywordId: number, categoryId: number }) {
    return graphQLRequest<'deleteKeyword', boolean>(`
        mutation {
            deleteKeyword(keywordId: ${data.keywordId}, categoryId: ${data.categoryId})
        }
    `);
}
