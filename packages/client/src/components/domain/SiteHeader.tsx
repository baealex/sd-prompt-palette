import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { usePathStore } from '~/state/path-store';

const LINK_IDLE = 'ui-focus-ring rounded-token-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink';
const LINK_ACTIVE = 'rounded-token-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800';
const MOBILE_LINK_IDLE = 'ui-focus-ring flex h-full min-h-14 flex-1 items-center justify-center px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted';
const MOBILE_LINK_ACTIVE = 'flex h-full min-h-14 flex-1 items-center justify-center border-t-2 border-brand-700 bg-brand-50 px-2 text-xs font-semibold text-brand-800';

export const SiteHeader = () => {
    const { paths } = usePathStore();

    const navItems = useMemo(() => ([
        { to: '/', label: 'Home' },
        { to: '/idea', label: 'Idea' },
        { to: paths.collection, label: 'Collection' },
        { to: '/image-load', label: 'Prompt Info' },
    ] as const), [paths.collection]);

    return (
        <>
            <header className="sticky top-0 z-20 border-b border-line bg-surface-base/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
                    <Link to="/" className="ui-focus-ring rounded-token-md px-1 text-lg font-semibold tracking-tight text-ink">
                        Prompt Palette
                    </Link>

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
            </header>

            <nav className="fixed inset-x-0 bottom-0 z-30 grid h-14 grid-cols-4 border-t border-line bg-surface-base md:hidden">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={MOBILE_LINK_IDLE}
                        activeProps={{ className: MOBILE_LINK_ACTIVE }}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </>
    );
};
