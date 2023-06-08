interface ComponentProps<T> {
    id?: string;
    tag?: keyof HTMLElementTagNameMap;
    className?: string;
    initialState?: T;
}

export default class Component<T extends HTMLElement = HTMLDivElement, K = unknown> {
    $el: T;
    state: K;
    _isMounted: boolean;

    constructor($parent: HTMLElement, props?: ComponentProps<K>) {
        this.$el = document.createElement(props?.tag || 'div') as T;

        if (props?.id) {
            this.$el.id = props.id;
        }

        if (props?.className) {
            this.$el.className = props.className;
        }
      
        $parent.appendChild(this.$el);
        this.setState(props?.initialState);
        this.rerender();
        this._isMounted = true;
    }

    useSelector<T extends HTMLElement>(selector: string): T {
        return this.$el.querySelector(selector) as T;
    }

    rerender() {
        if (this._isMounted) {
            this.unmount();
        }
        this.$el.innerHTML = this.render();
        this.mount();
    }

    setState(nextState: K) {
        this.state = nextState;
        if (this._isMounted) {
            this.rerender();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mount() {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unmount() {
      
    }

    render() {
        return '';
    }
}
