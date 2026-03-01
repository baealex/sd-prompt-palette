import {
    Outlet,
    createRootRoute,
    createRoute,
    createRouter,
    useParams,
} from '@tanstack/react-router';

import { SiteLayout } from '~/components/domain/SiteLayout';
import { CollectionDetailPage } from '~/pages/CollectionDetailPage';
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

const collectionRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/collection',
    component: CollectionViewLayout,
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
