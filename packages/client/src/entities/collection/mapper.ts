import type { Collection } from '~/models/types';

export type CollectionSummaryItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;

interface RawCollectionSummaryItem {
    id: number | string;
    title: string;
    prompt: string;
    negativePrompt: string;
    image: Collection['image'];
}

export const toCollectionSummaryItem = (
    item: RawCollectionSummaryItem,
): CollectionSummaryItem | null => {
    const normalizedId = Number(item.id);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
        return null;
    }

    return {
        id: normalizedId,
        title: item.title,
        prompt: item.prompt,
        negativePrompt: item.negativePrompt,
        image: item.image,
    };
};

export const toCollectionSummaryItems = (
    items: RawCollectionSummaryItem[],
): CollectionSummaryItem[] => {
    return items
        .map((item) => toCollectionSummaryItem(item))
        .filter((item): item is CollectionSummaryItem => item !== null);
};
