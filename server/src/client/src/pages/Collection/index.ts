import styles from './Collection.module.scss';
import icon from '~/icon';

import { Header, Prompts } from '~/components';

import { Component, html, htmlToElement } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { deleteCollection, getCollections } from '~/api';

interface State {
    collections: {
        id: number;
        title: string;
        prompt: string;
        negativePrompt: string;
        image: {
            url: string;
        };
    }[];
}

export class Collection extends Component<HTMLDivElement, State> {
    constructor($parent: HTMLElement) {
        new Header($parent);

        super($parent, { className: styles.Manage });

        getCollections().then(({ data: { allCollections } }) => {
            this.setState({ collections: allCollections });
        });
    }

    handleCopyToClipboard = (e: MouseEvent) => {
        const keyword = (e.target as HTMLElement).textContent;
        navigator.clipboard.writeText(keyword
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
        );
        snackBar('😍 Copied to clipboard');
    };

    handleDelete = async (e: MouseEvent) => {
        const { id } = (e.target as HTMLElement).dataset;
        await deleteCollection({ id: Number(id) });
        this.setState((state) => ({
            collections: state.collections.filter(
                (collection) => Number(collection.id) !== Number(id)),
        }));
        snackBar('😍 Successfully deleted');
    };

    async mount() {
        document.title = 'Collection | SD Prompt Palette';

        this.$el.querySelectorAll('[data-name="collection"]')
            .forEach(($collection) => {
                const $prompts = $collection.querySelector('[data-name="prompts"]');

                const ceratePrompts = (text: string) => {
                    return text
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .split(',')
                        .map((prompt) => prompt.trim());
                };

                const { prompt, negativePrompt } = ($collection as HTMLElement).dataset;
                $prompts.appendChild(htmlToElement(html`
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>Prompt</h2>
                        <button class="secondary-button" data-name="copy-prompt">
                            ${icon.draft} copy all
                        </button>
                    </div>
                `));
                new Prompts($prompts as HTMLElement, {
                    prompts: ceratePrompts(prompt),
                    onClick: this.handleCopyToClipboard,
                });
                $prompts.appendChild(htmlToElement(html`
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>Negative Prompt</h2>
                        <button class="secondary-button" data-name="copy-negative-prompt">
                            ${icon.draft} copy all
                        </button>
                    </div>
                `));
                new Prompts($prompts as HTMLElement, {
                    prompts: ceratePrompts(negativePrompt),
                    onClick: this.handleCopyToClipboard,
                });
                $collection.querySelector('[data-name="remove"]').addEventListener('click', this.handleDelete);
                $collection.querySelector('[data-name="copy-prompt"]').addEventListener('click', () => {
                    const prompts = ceratePrompts(prompt);
                    navigator.clipboard.writeText(prompts.join(', '));
                    snackBar(`😍 Copied ${prompts.length} prompts to clipboard`);
                });
                $collection.querySelector('[data-name="copy-negative-prompt"]').addEventListener('click', () => {
                    const prompts = ceratePrompts(negativePrompt);
                    navigator.clipboard.writeText(prompts.join(', '));
                    snackBar(`😍 Copied ${prompts.length} negative prompts to clipboard`);
                });
            });
    }

    render() {
        return html`
            <div class="${styles.container}">
                <div class="${styles.collection}">
                    ${this.state?.collections?.map((collection) => html`
                        <div
                            class="${styles.item}"
                            data-name="collection"
                            data-prompt="${collection.prompt}"
                            data-negative-prompt="${collection.negativePrompt}"
                        >
                            <div class="${styles.header}">
                                <h2>${collection.title}</h2>
                                <button
                                    class="primary-button"
                                    data-name="remove"
                                    data-id="${collection.id}"
                                >
                                    ${icon.delete}
                                    Remove
                                </button>
                            </div>
                            <img class="${styles.image}" src="${collection.image.url}" />
                            <div class="${styles.body}" data-name="prompts"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
