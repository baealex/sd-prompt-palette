import { Router } from './modules/core/router';
import { Home, Manage } from './pages';

import './styles/main.scss';

(function main() {
    const router = new Router(document.getElementById('root'))
        .routes('/', Home)
        .routes('/manage', Manage);

    router.push(window.location.pathname);
})();
