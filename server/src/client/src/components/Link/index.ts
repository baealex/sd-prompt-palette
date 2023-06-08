import styles from './Link.module.scss';

import { Component } from '~/modules/core';
import { useRouter } from '~/modules/core/router';

interface State {
    text: string;
    href: string;
}

export class Link extends Component<HTMLAnchorElement, State> {
    constructor($parent: HTMLElement, initialState: State) {
        super($parent, {
            tag: 'a',
            className: styles.Link,
            initialState,
        });
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
