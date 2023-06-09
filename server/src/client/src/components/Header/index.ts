import styles from './Header.module.scss';

import { Component, html } from '~/modules/core';
import { Link } from '../Link';

export class Header extends Component {
    constructor($parent: HTMLElement) {
        super($parent, { tag: 'header', className: styles.header });
    }

    mount() {
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
            text: 'PNG Info',
            href: '/image-load',
            className: window.location.pathname === '/image-load' ? styles.active : '',
        });
    }

    render() {
        return html`
            <h1>Prompt Palette</h1>
            <div class="${styles.links}"></div>
        `;
    }
}