import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { CrossIcon, MenuIcon } from '~/icons';
import { usePathStore } from '~/state/path-store';

const LINK_IDLE = 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900';
const LINK_ACTIVE = 'rounded-lg bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-800';

export const SiteHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { paths } = usePathStore();

    const navItems = useMemo(() => ([
        { to: '/', label: 'Home' },
        { to: '/idea', label: 'Idea' },
        { to: paths.collection, label: 'Collection' },
        { to: '/image-load', label: 'PNG Info' },
    ] as const), [paths.collection]);

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
                <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
                    Prompt Palette
                </Link>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 md:hidden"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                >
                    {menuOpen ? <CrossIcon /> : <MenuIcon />}
                </button>

                <nav className="hidden items-center gap-2 md:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={LINK_IDLE}
                            activeProps={{ className: LINK_ACTIVE }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {menuOpen ? (
                <nav className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={LINK_IDLE}
                            activeProps={{ className: LINK_ACTIVE }}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            ) : null}
        </header>
    );
};
