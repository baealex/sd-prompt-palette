import { Router } from './modules/core/router';
import { Home, Manage, ImageLoad } from './pages';

import './styles/main.scss';

(function main() {
    const router = new Router(document.getElementById('root'))
        .routes('/', Home)
        .routes('/manage', Manage)
        .routes('/image-load', ImageLoad);

    router.push(window.location.pathname, true);
})();
