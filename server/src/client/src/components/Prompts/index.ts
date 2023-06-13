import styles from './Prompts.module.scss';

import { Component, html } from '~/modules/core';

interface State {
    prompts: string[];
    onClick?: (e: MouseEvent) => void;
    onContextMenu?: (e: MouseEvent) => void;
}

export class Prompts extends Component<HTMLAnchorElement, State> {
    constructor($parent: HTMLElement, initialState: State) {
        super($parent, {
            tag: 'ul',
            className: styles.Prompts,
            initialState
        });
    }

    mount() {
        this.$el.querySelectorAll('li').forEach(($li) => {
            if (this.state.onClick) {
                $li.addEventListener('click', this.state.onClick);
            }
            if (this.state.onContextMenu) {
                $li.addEventListener('contextmenu', this.state.onContextMenu);
            }
        });
    }

    unmount() {
        this.$el.querySelectorAll('li').forEach(($li) => {
            if (this.state.onClick) {
                $li.removeEventListener('click', this.state.onClick);
            }
            if (this.state.onContextMenu) {
                $li.removeEventListener('contextmenu', this.state.onContextMenu);
            }
        });
    }

    render() {
        return html`
            ${this.state.prompts.map((prompt) => `<li>${prompt}</li>`).join('')}
        `;
    }
}
