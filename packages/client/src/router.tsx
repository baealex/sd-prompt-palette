import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Outlet, createRootRoute, createRoute, createRouter, useParams } from '@tanstack/react-router';

import { SiteLayout } from '~/components/domain/SiteLayout';
import { CollectionBrowsePage } from '~/pages/CollectionBrowsePage';
import { CollectionDetailPage } from '~/pages/CollectionDetailPage';
import { CollectionGalleryPage } from '~/pages/CollectionGalleryPage';
import { CollectionListPage } from '~/pages/CollectionListPage';
import { CollectionSlideShowPage } from '~/pages/CollectionSlideShowPage';
import { HomePage } from '~/pages/HomePage';
import { IdeaPage } from '~/pages/IdeaPage';
import { ImageLoadPage } from '~/pages/ImageLoadPage';

const RootRouteComponent = () => {
    return (
        <>
            <Outlet />
            {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
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

const slideShowRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/collection/slide-show',
    component: CollectionSlideShowPage,
});

const homeRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/',
    component: HomePage,
});

const ideaRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/idea',
    component: IdeaPage,
});

const collectionListRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection',
    component: CollectionListPage,
});

const collectionGalleryRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection/gallery',
    component: CollectionGalleryPage,
});

const collectionBrowseRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection/browse',
    component: CollectionBrowsePage,
});

const CollectionDetailRouteComponent = () => {
    const { id } = useParams({ from: '/app-layout/collection/$id' });
    return <CollectionDetailPage id={id} />;
};

const collectionDetailRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection/$id',
    component: CollectionDetailRouteComponent,
});

const imageLoadRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/image-load',
    component: ImageLoadPage,
});

export const routeTree = rootRoute.addChildren([
    slideShowRoute,
    appLayoutRoute.addChildren([
        homeRoute,
        ideaRoute,
        collectionListRoute,
        collectionGalleryRoute,
        collectionBrowseRoute,
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
