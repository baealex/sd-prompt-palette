import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { ArrowLeftIcon, CrossIcon, MenuIcon } from '~/icons';
import {
    DEFAULT_SHOWCASE_THEME,
    SHOWCASE_THEMES,
    THEME_COMPONENTS,
} from '~/features/showcase/themes';
import type { ShowcaseThemeId } from '~/features/showcase/types';

const VALID_THEME_IDS = new Set<string>(SHOWCASE_THEMES.map((t) => t.id));

const parseThemeParam = (input: unknown): ShowcaseThemeId => {
    if (typeof input === 'string' && VALID_THEME_IDS.has(input)) {
        return input as ShowcaseThemeId;
    }
    return DEFAULT_SHOWCASE_THEME;
};

export const ShowcasePage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        setMobileMenuOpen(false);
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
                className="fixed bottom-8 left-6 z-30 hidden h-11 items-center gap-2 rounded-full bg-black/60 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur transition-colors hover:bg-black/75 md:inline-flex"
            >
                <ArrowLeftIcon width={16} height={16} />
                Back
            </Link>

            <div className="fixed bottom-8 left-1/2 z-30 hidden -translate-x-1/2 gap-1 rounded-full bg-black/60 p-1 backdrop-blur md:flex">
                {SHOWCASE_THEMES.map((theme) => (
                    <button
                        type="button"
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                            activeThemeId === theme.id
                                ? 'bg-white text-black'
                                : 'text-white/70 hover:text-white'
                        }`}
                    >
                        {theme.label}
                    </button>
                ))}
            </div>

            {mobileMenuOpen && (
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close showcase controls"
                    className="fixed inset-0 z-30 bg-transparent md:hidden"
                />
            )}

            <div className="fixed bottom-0 left-0 z-40 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
                {mobileMenuOpen && (
                    <div className="mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-black/70 p-2 text-white shadow-lg backdrop-blur">
                        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
                            Showcase Controls
                        </p>
                        <Link
                            to="/collection"
                            onClick={() => setMobileMenuOpen(false)}
                            className="mb-2 inline-flex min-h-11 w-full items-center gap-2 rounded-full bg-black/55 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur transition-colors hover:bg-black/70"
                        >
                            <ArrowLeftIcon width={16} height={16} />
                            Back to Collection
                        </Link>

                        <div className="grid gap-1">
                            {SHOWCASE_THEMES.map((theme) => (
                                <button
                                    type="button"
                                    key={theme.id}
                                    onClick={() => handleThemeChange(theme.id)}
                                    aria-pressed={activeThemeId === theme.id}
                                    className={`min-h-11 w-full rounded-full px-4 text-left text-sm font-semibold transition-colors ${
                                        activeThemeId === theme.id
                                            ? 'bg-white text-black'
                                            : 'bg-black/35 text-white/85 hover:bg-black/55 hover:text-white'
                                    }`}
                                >
                                    {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    aria-expanded={mobileMenuOpen}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/65 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80"
                >
                    {mobileMenuOpen ? (
                        <CrossIcon width={14} height={14} />
                    ) : (
                        <MenuIcon width={14} height={14} />
                    )}
                    <span>Controls</span>
                </button>
            </div>
        </div>
    );
};
