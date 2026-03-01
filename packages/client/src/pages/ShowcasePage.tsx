import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { ArrowLeftIcon } from '~/icons';
import {
    DEFAULT_SHOWCASE_THEME,
    SHOWCASE_THEMES,
    THEME_COMPONENTS,
} from '~/features/showcase/themes';
import type { ShowcaseThemeId } from '~/features/showcase/types';

const VALID_THEME_IDS = new Set<string>(
    SHOWCASE_THEMES.map((t) => t.id),
);

const parseThemeParam = (input: unknown): ShowcaseThemeId => {
    if (typeof input === 'string' && VALID_THEME_IDS.has(input)) {
        return input as ShowcaseThemeId;
    }
    return DEFAULT_SHOWCASE_THEME;
};

export const ShowcasePage = () => {
    const navigate = useNavigate();
    const activeThemeId = useSearch({
        strict: false,
        select: (search) =>
            parseThemeParam((search as Record<string, unknown>).theme),
    });

    const ThemeComponent = THEME_COMPONENTS[activeThemeId];
    const activeDescriptor = useMemo(
        () => SHOWCASE_THEMES.find((t) => t.id === activeThemeId)!,
        [activeThemeId],
    );

    useEffect(() => {
        if (activeDescriptor.scrollable) {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [activeDescriptor.scrollable]);

    const handleThemeChange = (themeId: ShowcaseThemeId) => {
        void navigate({
            to: '/collection/showcase',
            replace: true,
            search: (prev) => ({
                ...(prev as Record<string, unknown>),
                theme: themeId === DEFAULT_SHOWCASE_THEME ? undefined : themeId,
            }),
        });
    };

    const containerClassName = activeDescriptor.scrollable
        ? 'relative min-h-screen w-full bg-black text-white'
        : 'relative h-screen w-full overflow-hidden bg-black text-white';

    return (
        <div className={containerClassName}>
            <ThemeComponent />

            <Link
                to="/collection"
                className="fixed left-6 top-6 z-30 flex items-center gap-1.5 rounded bg-black/45 px-3 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/60"
            >
                <ArrowLeftIcon width={14} height={14} />
                Back
            </Link>

            <div className="fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full bg-black/60 p-1 backdrop-blur">
                {SHOWCASE_THEMES.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                            activeThemeId === theme.id
                                ? 'bg-white text-black'
                                : 'text-white/70 hover:text-white'
                        }`}
                    >
                        {theme.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
