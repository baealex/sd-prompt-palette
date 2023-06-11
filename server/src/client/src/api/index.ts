import axios from 'axios';

interface Keyword {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    keywords: {
        order: number;
        keyword: Keyword;
    }[];
}

export function getCategories() {
    return axios.request<Category[]>({
        method: 'GET',
        url: '/api/categories',
    });
}

export function createCategory(data: { name: string }) {
    return axios.request<Category>({
        method: 'POST',
        url: '/api/categories',
        data,
    });
}

export function updateCategory(id: number, data: { name: string }) {
    return axios.request<Category>({
        method: 'PUT',
        url: `/api/categories/${id}`,
        data,
    });
}

export function deleteCategory(id: number) {
    return axios.request({
        method: 'DELETE',
        url: `/api/categories/${id}`,
    });
}

export function createKeyword(data: { categoryId: number; name: string }) {
    return axios.request<Keyword>({
        method: 'POST',
        url: '/api/keywords',
        data,
    });
}

export function deleteKeyword(id: number, data: { categoryId: number }) {
    return axios.request({
        method: 'DELETE',
        url: `/api/keywords/${id}`,
        data,
    });
}
