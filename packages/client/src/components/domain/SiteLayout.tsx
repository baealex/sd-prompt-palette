import { Link, Outlet } from '@tanstack/react-router';

const NAV_IDLE = 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900';
const NAV_ACTIVE = 'rounded-lg bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-800';

const navItems = [
    { to: '/', label: 'Home' },
    { to: '/idea', label: 'Idea' },
    { to: '/collection', label: 'Collection' },
    { to: '/collection/gallery', label: 'Gallery' },
    { to: '/image-load', label: 'Image Load' },
] as const;

export function SiteLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
                    <strong className="mr-2 text-sm uppercase tracking-wide text-slate-500">Prompt Palette</strong>
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={NAV_IDLE}
                            activeProps={{ className: NAV_ACTIVE }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
