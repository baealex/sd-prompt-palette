import { Router } from './modules/core/router';
import { Home, Manage, ImageLoad, Collection } from './pages';

import './styles/main.scss';

(function main() {
    const router = new Router(document.getElementById('root'))
        .routes('/', Home)
        .routes('/manage', Manage)
        .routes('/image-load', ImageLoad)
        .routes('/collection', Collection);

    router.push(window.location.pathname, true);
})();
