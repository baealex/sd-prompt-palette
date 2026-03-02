import { lazy } from 'react';
import type { LazyExoticComponent } from 'react';
import type { ComponentType } from 'react';

import type { ShowcaseThemeDescriptor, ShowcaseThemeId } from './types';

const SlideshowTheme = lazy(async () => {
    const module = await import('./themes/SlideshowTheme');
    return { default: module.SlideshowTheme };
});
const MoodBoardTheme = lazy(async () => {
    const module = await import('./themes/MoodBoardTheme');
    return { default: module.MoodBoardTheme };
});
const MinimalStoreTheme = lazy(async () => {
    const module = await import('./themes/MinimalStoreTheme');
    return { default: module.MinimalStoreTheme };
});

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

export const THEME_COMPONENTS: Record<
    ShowcaseThemeId,
    LazyExoticComponent<ComponentType>
> = {
    slideshow: SlideshowTheme,
    moodboard: MoodBoardTheme,
    'minimal-store': MinimalStoreTheme,
};
