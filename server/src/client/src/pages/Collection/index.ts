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

        this.useSelector(`.${styles.collection}`)
            .querySelectorAll('[data-name="collection"]')
            .forEach((collection) => {
                const ceratePrompts = (text: string) => {
                    return text
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .split(',')
                        .map((prompt) => prompt.trim());
                };

                const { prompt, negativePrompt } = (collection as HTMLElement).dataset;
                collection.appendChild(htmlToElement('<h3>Prompt</h3>'));
                new Prompts(collection as HTMLElement, {
                    prompts: ceratePrompts(prompt),
                    onClick: this.handleCopyToClipboard,
                });
                collection.appendChild(htmlToElement('<h3>Negative Prompt</h3>'));
                new Prompts(collection as HTMLElement, {
                    prompts: ceratePrompts(negativePrompt),
                    onClick: this.handleCopyToClipboard,
                });
                collection.querySelector('[data-name="remove"]').addEventListener('click', this.handleDelete);
            });
    }

    render() {
        return html`
            <div class="${styles.container}">
                <div class="${styles.collection}">
                    ${this.state?.collections?.map((collection) => html`
                        <div class="${styles.collectionItem}">
                            <img src="${collection.image.url}" />
                            <div
                                data-name="collection"
                                data-prompt="${collection.prompt}"
                                data-negative-prompt="${collection.negativePrompt}"
                            >
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                ">
                                    <h2>${collection.title}</h2>
                                    <button
                                        data-name="remove"
                                        data-id="${collection.id}"
                                    >
                                        ${icon.delete}
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
