import styles from './Collection.module.scss';
import icon from '~/icon';

import { Header, Pagination, Prompts } from '~/components';

import { Component, html, htmlToElement } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { deleteCollection, getCollections } from '~/api';
import { CollectionNav } from '~/components/CollectionNav';

interface State {
    page: number;
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

const memo: State = {
    page: 1,
    collections: [],
};

export class Collection extends Component<HTMLDivElement, State> {
    constructor($parent: HTMLElement) {
        new Header($parent);

        super($parent, {
            className: styles.Manage,
            initialState: memo,
        });

        getCollections({
            page: this.state.page,
            limit: 12,
        }).then(({ data: { allCollections } }) => {
            this.setState((state) => ({
                ...state,
                collections: allCollections
            }));
        });
    }

    setState(nextState: State | ((prevState: State) => State)): void {
        super.setState(nextState);
        Object.assign(memo, this.state);
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
            ...state,
            collections: state.collections.filter(
                (collection) => Number(collection.id) !== Number(id)),
        }));
        snackBar('😍 Successfully deleted');
    };

    async mount() {
        document.title = 'Collection | SD Prompt Palette';

        new CollectionNav(this.selectName('nav'));
        new Pagination(this.selectName('pagination'), {
            page: this.state?.page,
            onClick: (page) => {
                getCollections({
                    page,
                    limit: 24,
                }).then(({ data: { allCollections } }) => {
                    this.setState({
                        page,
                        collections: allCollections
                    });
                });
            },
        });

        this.selectNames('collection')
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
                    navigator.clipboard.writeText(prompt);
                    snackBar('😍 Copied prompts to clipboard');
                });
                $collection.querySelector('[data-name="copy-negative-prompt"]').addEventListener('click', () => {
                    navigator.clipboard.writeText(negativePrompt);
                    snackBar('😍 Copied negative prompts to clipboard');
                });
            });
    }

    render() {
        return html`
            <div class="${styles.container}">
                <div data-name="nav"></div>
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
                <div data-name="pagination"></div>
            </div>
        `;
    }
}
