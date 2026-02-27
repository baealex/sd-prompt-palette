import type { UniqueIdentifier } from '@dnd-kit/core';

const CATEGORY_PREFIX = 'category-';
const KEYWORD_PREFIX = 'keyword-';

export const makeCategorySortableId = (categoryId: number) => `${CATEGORY_PREFIX}${categoryId}`;
export const makeKeywordSortableId = (categoryId: number, keywordId: number) => `${KEYWORD_PREFIX}${categoryId}-${keywordId}`;

export const parseCategorySortableId = (id: UniqueIdentifier) => {
    const value = String(id);
    if (!value.startsWith(CATEGORY_PREFIX)) {
        return null;
    }

    const parsed = Number(value.slice(CATEGORY_PREFIX.length));
    return Number.isNaN(parsed) ? null : parsed;
};

export const parseKeywordSortableId = (id: UniqueIdentifier) => {
    const value = String(id);
    if (!value.startsWith(KEYWORD_PREFIX)) {
        return null;
    }

    const [rawCategoryId, rawKeywordId] = value.slice(KEYWORD_PREFIX.length).split('-');
    const categoryId = Number(rawCategoryId);
    const keywordId = Number(rawKeywordId);

    if (Number.isNaN(categoryId) || Number.isNaN(keywordId)) {
        return null;
    }

    return {
        categoryId,
        keywordId,
    };
};
