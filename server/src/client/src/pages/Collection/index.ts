import styles from './Collection.module.scss';

import { Header, Prompts } from '~/components';

import { Component, html, htmlToElement } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { deleteCollection, getCollections } from '~/api';

export class Collection extends Component {
    constructor($parent: HTMLElement) {
        new Header($parent);
        super($parent, { className: styles.Manage });
    }

    handleCopy = (e: any) => {
        const keyword = e.target.textContent;
        navigator.clipboard.writeText(keyword);
        snackBar('😍 Copied to clipboard');
    };

    async mount() {
        document.title = 'Collection | SD Prompt Palette';

        const { data } = await getCollections();

        const $collection = this.useSelector(`.${styles.collection}`);

        data.allCollections.forEach((collection) => {
            const div = document.createElement('div');

            const $collectionItem = htmlToElement(html`
                <div class="${styles.collectionItem}">
                    <img src="${collection.image.url}" />
                    <div id="collection-${collection.id}">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;"
                        >
                            <h3>${collection.title}</h3>
                            <button data-id="${collection.id}" class="remove">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            `);
            const body = $collectionItem.querySelector(`#collection-${collection.id}`);
            body.appendChild(htmlToElement('<h4>Prompt</h4>'));
            new Prompts(body as HTMLElement, {
                prompts: collection.prompt.split(',').map((prompt) => prompt.trim()),
                onClick: this.handleCopy,
            });
            body.appendChild(htmlToElement('<h4>Negative Prompt</h4>'));
            new Prompts(body as HTMLElement, {
                prompts: collection.negativePrompt.split(',').map((prompt) => prompt.trim()),
                onClick: this.handleCopy,
            });

            const $removeButton = $collectionItem.querySelector('.remove');
            $removeButton.addEventListener('click', async (e: any) => {
                const id = e.target.dataset.id;
                try {
                    await deleteCollection({ id });
                    div.remove();
                    snackBar('😍 Removed');
                } catch (e) {
                    snackBar('😭 Failed to remove');
                }
            });

            div.append($collectionItem);
            $collection.appendChild(div);
        });
    }

    render() {
        return html`
            <div class="${styles.container}">
                <h2>Collection</h2>
                <div class="${styles.collection}"></div>
            </div>
        `;
    }
}
