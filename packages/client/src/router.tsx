import {
    Outlet,
    createRootRoute,
    createRoute,
    createRouter,
    useParams,
} from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import type { ReactNode } from 'react';

import { SiteLayout } from '~/components/domain/SiteLayout';
import { parseCollectionSearchParams } from '~/features/collection/view-filter';
import { ShowcaseLoading } from '~/features/showcase/ShowcaseLoading';

const HomePage = lazy(async () => {
    const module = await import('~/pages/HomePage');
    return { default: module.HomePage };
});
const IdeaPage = lazy(async () => {
    const module = await import('~/pages/IdeaPage');
    return { default: module.IdeaPage };
});
const CollectionPage = lazy(async () => {
    const module = await import('~/pages/CollectionPage');
    return { default: module.CollectionPage };
});
const CollectionDetailPage = lazy(async () => {
    const module = await import('~/pages/CollectionDetailPage');
    return { default: module.CollectionDetailPage };
});
const ImageLoadPage = lazy(async () => {
    const module = await import('~/pages/ImageLoadPage');
    return { default: module.ImageLoadPage };
});
const ShowcasePage = lazy(async () => {
    const module = await import('~/pages/ShowcasePage');
    return { default: module.ShowcasePage };
});

const RouteFallback = () => {
    return (
        <section
            aria-label="Page loading"
            className="animate-pulse space-y-4 rounded-token-lg border border-line bg-surface-base p-4 shadow-surface"
        >
            <div className="space-y-2">
                <div className="h-6 w-44 rounded-token-sm bg-surface-muted" />
                <div className="h-4 w-72 max-w-full rounded-token-sm bg-surface-muted" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="h-36 rounded-token-md bg-surface-muted" />
                <div className="h-36 rounded-token-md bg-surface-muted" />
            </div>
            <div className="h-10 w-32 rounded-token-md bg-surface-muted" />
        </section>
    );
};

const ShowcaseRouteFallback = () => {
    return <ShowcaseLoading />;
};

const withRouteSuspense = (Component: ComponentType, fallback?: ReactNode) => {
    const WrappedComponent = () => {
        return (
            <Suspense fallback={fallback ?? <RouteFallback />}>
                <Component />
            </Suspense>
        );
    };

    return WrappedComponent;
};

const RootRouteComponent = () => {
    return (
        <>
            <Outlet />
        </>
    );
};

const rootRoute = createRootRoute({
    component: RootRouteComponent,
});

const appLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'app-layout',
    component: SiteLayout,
});

const showcaseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/collection/showcase',
    component: withRouteSuspense(ShowcasePage, <ShowcaseRouteFallback />),
});

const homeRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/',
    component: withRouteSuspense(HomePage),
});

const ideaRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/idea',
    component: withRouteSuspense(IdeaPage),
});

const collectionRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection',
    validateSearch: (search) =>
        parseCollectionSearchParams(search as Record<string, unknown>),
    component: withRouteSuspense(CollectionPage),
});

const CollectionDetailRouteComponent = () => {
    const { id } = useParams({ from: '/app-layout/collection/$id' });
    return (
        <Suspense fallback={<RouteFallback />}>
            <CollectionDetailPage id={id} />
        </Suspense>
    );
};

const collectionDetailRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection/$id',
    component: CollectionDetailRouteComponent,
});

const imageLoadRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/image-load',
    component: withRouteSuspense(ImageLoadPage),
});

export const routeTree = rootRoute.addChildren([
    showcaseRoute,
    appLayoutRoute.addChildren([
        homeRoute,
        ideaRoute,
        collectionRoute,
        collectionDetailRoute,
        imageLoadRoute,
    ]),
]);

export const router = createRouter({
    routeTree,
    scrollRestoration: true,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
