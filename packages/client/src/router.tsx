import {
    Outlet,
    createRootRoute,
    createRoute,
    createRouter,
    useParams,
} from '@tanstack/react-router';

import { SiteLayout } from '~/components/domain/SiteLayout';
import { CollectionBrowsePage } from '~/pages/CollectionBrowsePage';
import { CollectionDetailPage } from '~/pages/CollectionDetailPage';
import { CollectionGalleryPage } from '~/pages/CollectionGalleryPage';
import { CollectionListPage } from '~/pages/CollectionListPage';
import { ShowcasePage } from '~/pages/ShowcasePage';
import { CollectionViewLayout } from '~/components/domain/CollectionViewLayout';
import { HomePage } from '~/pages/HomePage';
import { IdeaPage } from '~/pages/IdeaPage';
import { ImageLoadPage } from '~/pages/ImageLoadPage';

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
    component: ShowcasePage,
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

const collectionViewLayoutRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    id: 'collection-view-layout',
    component: CollectionViewLayout,
});

const collectionListRoute = createRoute({
    getParentRoute: () => collectionViewLayoutRoute,
    path: '/collection',
    component: CollectionListPage,
});

const collectionGalleryRoute = createRoute({
    getParentRoute: () => collectionViewLayoutRoute,
    path: '/collection/gallery',
    component: CollectionGalleryPage,
});

const collectionBrowseRoute = createRoute({
    getParentRoute: () => collectionViewLayoutRoute,
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
    showcaseRoute,
    appLayoutRoute.addChildren([
        homeRoute,
        ideaRoute,
        collectionViewLayoutRoute.addChildren([
            collectionListRoute,
            collectionGalleryRoute,
            collectionBrowseRoute,
        ]),
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
