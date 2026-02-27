import { Outlet } from '@tanstack/react-router';

import { SiteHeader } from './SiteHeader';

export const SiteLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
            <SiteHeader />

            <main className="mx-auto max-w-6xl px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
};
