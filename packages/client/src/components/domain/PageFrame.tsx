import type { ReactNode } from 'react';

import { Card } from '~/components/ui/Card';

type PageFrameSurface = 'card' | 'plain';

interface PageFrameProps {
    title?: string;
    description?: string;
    surface?: PageFrameSurface;
    children?: ReactNode;
}

export const PageFrame = ({
    title,
    description,
    surface = 'plain',
    children,
}: PageFrameProps) => {
    const content = (
        <>
            {title || description ? (
                <header className="mb-3 sm:mb-4">
                    {title ? (
                        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                            {title}
                        </h1>
                    ) : null}
                    {description ? (
                        <p className={title ? 'mt-2 text-sm text-ink-muted' : 'text-sm text-ink-muted'}>
                            {description}
                        </p>
                    ) : null}
                </header>
            ) : null}
            {children}
        </>
    );

    if (surface === 'plain') {
        return <section>{content}</section>;
    }

    return (
        <Card
            as="section"
            padding="lg"
            className="bg-surface-base/95 -mx-3 rounded-none border-x-0 sm:mx-0 sm:rounded-token-lg sm:border-x"
        >
            {content}
        </Card>
    );
};
