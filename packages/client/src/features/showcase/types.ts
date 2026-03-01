export type ShowcaseThemeId = 'slideshow' | 'moodboard' | 'minimal-store';

export interface ShowcaseThemeDescriptor {
    id: ShowcaseThemeId;
    label: string;
    description: string;
    scrollable: boolean;
}
