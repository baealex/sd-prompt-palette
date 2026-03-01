import type { ComponentType } from 'react';

import type { ShowcaseThemeDescriptor, ShowcaseThemeId } from './types';
import { SlideshowTheme } from './themes/SlideshowTheme';
import { MoodBoardTheme } from './themes/MoodBoardTheme';
import { MinimalStoreTheme } from './themes/MinimalStoreTheme';

export const SHOWCASE_THEMES: ShowcaseThemeDescriptor[] = [
    {
        id: 'slideshow',
        label: 'Slideshow',
        description: 'Auto-playing fullscreen slideshow with blur background',
        scrollable: false,
    },
    {
        id: 'moodboard',
        label: 'Mood Board',
        description: 'Pinterest-style masonry collage for free exploration',
        scrollable: true,
    },
    {
        id: 'minimal-store',
        label: 'Minimal Store',
        description: 'Clean grid layout inspired by modern storefronts',
        scrollable: true,
    },
];

export const DEFAULT_SHOWCASE_THEME: ShowcaseThemeId = 'slideshow';

export const THEME_COMPONENTS: Record<ShowcaseThemeId, ComponentType> = {
    slideshow: SlideshowTheme,
    moodboard: MoodBoardTheme,
    'minimal-store': MinimalStoreTheme,
};
