import Component from './component';

const routerInstance = (() => {
    let _instance: Router = null;

    return {
        get() {
            return _instance;
        },
        set(instance: Router) {
            _instance = instance;
        }
    };
})();

export const useRouter = () => {
    return routerInstance.get();
};

export class Router {
    $root: HTMLElement;
    map: Map<string, typeof Component>;

    constructor($root: HTMLElement) {
        const router = routerInstance.get();
        if (router) return router;

        window.addEventListener('popstate', () => {
            this.push(window.location.pathname, true);
        });
        this.$root = $root;
        this.map = new Map();
        routerInstance.set(this);
    }

    routes(path: string, component: unknown) {
        this.map.set(path, component as typeof Component);
        return this;
    }

    push(path: string, isPopState = false) {
        if (this.map.has(path)) {
            if (window.location.pathname === path && !isPopState) {
                return;
            }

            if (!isPopState) {
                window.history.pushState({}, '', path);
            }

            const component = this.map.get(path);
            this.$root.innerHTML = '';
            new component(this.$root);
        }
    }
}
