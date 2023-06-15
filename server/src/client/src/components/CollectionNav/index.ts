import icon from '~/icon';
import styles from './CollectionNav.module.scss';

import { Component } from '~/modules/core';

import { Link } from '../Link';

export class CollectionNav extends Component<HTMLAnchorElement> {
    constructor($parent: HTMLElement) {
        super($parent, {
            tag: 'nav',
            className: styles.CollectionNav,
        });
    }

    mount() {
        new Link(this.$el, {
            text: `${icon.list} List`,
            href: '/collection',
            className: window.location.pathname === '/collection' ? 'active' : '',
        });
        new Link(this.$el, {
            text: `${icon.grid} Grid`,
            href: '/collection/galley',
            className: window.location.pathname === '/collection/galley' ? 'active' : '',
        });
    }
}
