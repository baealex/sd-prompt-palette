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
        });
        new Link($links, {
            text: 'Manage',
            href: '/manage',
        });
    }

    render() {
        return html`
            <h1>SDPrompt Wiki</h1>
            <div class="${styles.links}"></div>
        `;
    }
}