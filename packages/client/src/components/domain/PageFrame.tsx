import type { ReactNode } from 'react';

interface PageFrameProps {
    title: string;
    description: string;
    children?: ReactNode;
}

export function PageFrame({ title, description, children }: PageFrameProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <header className="mb-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
            </header>
            {children}
        </section>
    );
}
