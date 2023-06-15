import styles from './Header.module.scss';

import { Component, html } from '~/modules/core';
import { Link } from '../Link';

import icon from '~/icon';

let lastCollectionPath = '/collection';

export class Header extends Component {
    constructor($parent: HTMLElement) {
        super($parent, { tag: 'header', className: styles.header });
    }

    mount() {
        if (window.location.pathname.includes('/collection')) {
            lastCollectionPath = window.location.pathname;
        }

        const $links = this.useSelector(`.${styles.links}`);
        new Link($links, {
            text: 'Home',
            href: '/',
            className: window.location.pathname === '/' ? styles.active : '',
        });
        new Link($links, {
            text: 'Manage',
            href: '/manage',
            className: window.location.pathname === '/manage' ? styles.active : '',
        });
        new Link($links, {
            text: 'Collection',
            href: lastCollectionPath,
            className: window.location.pathname.includes('/collection') ? styles.active : '',
        });
        new Link($links, {
            text: 'PNG Info',
            href: '/image-load',
            className: window.location.pathname === '/image-load' ? styles.active : '',
        });

        const $menu = this.useSelector(`.${styles.menu}`);
        $menu.addEventListener('click', () => {
            $menu.classList.toggle(styles.active);
            $links.classList.toggle(styles.active);
        });
    }

    render() {
        return html`
            <h1>Prompt Palette</h1>
            <div class="${styles.links}"></div>
            <button class="${styles.menu}">${icon.menu}</button>
        `;
    }
}