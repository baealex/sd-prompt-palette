import styles from './Link.module.scss';

import { Component } from '~/modules/core';
import { useRouter } from '~/modules/core/router';

interface State {
    text: string;
    href: string;
    className?: string;
}

export class Link extends Component<HTMLAnchorElement, State> {
    constructor($parent: HTMLElement, initialState: State) {
        super($parent, {
            tag: 'a',
            className: styles.Link + (initialState.className ? ` ${initialState.className}` : ''),
            initialState,
        });
        this.$el.href = initialState.href;
    }

    mount() {
        this.$el.addEventListener('click', (e) => {
            e.preventDefault();
            const router = useRouter();
            router.push(this.state.href);
        });
    }

    render() {
        return this.state.text;
    }
}
