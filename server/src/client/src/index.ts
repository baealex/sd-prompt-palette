import { Router } from './modules/core/router';
import { Home, Manage, ImageLoad, Collection, CollectionGalley } from './pages';

import './styles/main.scss';

(function main() {
    const router = new Router(document.getElementById('root'))
        .routes('/', Home)
        .routes('/manage', Manage)
        .routes('/image-load', ImageLoad)
        .routes('/collection', Collection)
        .routes('/collection/galley', CollectionGalley);

    router.push(window.location.pathname, true);
})();
