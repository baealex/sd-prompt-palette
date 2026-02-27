import { Outlet } from '@tanstack/react-router';

import { SiteHeader } from './SiteHeader';

export const SiteLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-bg via-slate-50 to-surface-base">
            <SiteHeader />

            <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">
                <Outlet />
            </main>
        </div>
    );
};
