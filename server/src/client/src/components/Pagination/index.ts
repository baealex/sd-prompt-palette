import icon from '~/icon';
import styles from './Pagination.module.scss';

import { Component, html } from '~/modules/core';

interface State {
    page: number;
    lastPage?: number;
    onClick: (page: number) => void;
}

export class Pagination extends Component<HTMLAnchorElement, State> {
    constructor($parent: HTMLElement, state: State) {
        super($parent, {
            tag: 'nav',
            className: styles.Pagination,
            initialState: state,
        });
    }

    mount() {
        this.selectName('prev').addEventListener('click', () => {
            if (this.state.page <= 1) return;

            this.state.onClick(this.state.page - 1);
        });

        this.selectName('next').addEventListener('click', () => {
            if (this.state.page >= this.state.lastPage) return;

            this.state.onClick(this.state.page + 1);
        });
    }

    render(): string {
        return html`
            <button
                data-name="prev"
                ${this.state.page <= 1 ? 'disabled' : ''}
                class="${styles.button} ${styles.prev}"
            >
                ${icon.left}
            </button>
            <span class="${styles.page}">
                ${this.state.page}
            </span>
            <button
                data-name="next"
                ${this.state.page >= this.state.lastPage ? 'disabled' : ''}
                class="${styles.button} ${styles.next}"
            >
                ${icon.right}
            </button>
        `;
    }
}
