import type { Category, Keyword } from '~/models/types';

export interface HomeCategory extends Pick<Category, 'id' | 'name' | 'order'> {
    keywords: Keyword[];
}
