import type { Collection } from '~/models/types';

export type CollectionBrowseItem = Pick<
    Collection,
    'id' | 'title' | 'prompt' | 'negativePrompt' | 'image'
>;

export const BROWSE_GALLERY_BREAKPOINTS = [
    { minWidth: 360, columns: 3 },
    { minWidth: 240, columns: 2 },
    { minWidth: 0, columns: 1 },
];
