import styles from './CollectionGalley.module.scss';

import { Header, CollectionNav, Pagination } from '~/components';

import { Component, html } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { deleteCollection, getCollections } from '~/api';

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

const limit = 24;

export class CollectionGalley extends Component<HTMLDivElement, State> {
    constructor($parent: HTMLElement) {
        new Header($parent);

        super($parent, {
            className: styles.Manage,
            initialState: memo,
        });

        getCollections({
            page: this.state.page,
            limit,
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
                    limit,
                }).then(({ data: { allCollections } }) => {
                    this.setState({
                        page,
                        collections: allCollections
                    });
                });
            },
        });
    }

    render() {
        return html`
            <div class="${styles.container}">
                <div data-name="nav"></div>
                <div class="${styles.collection} masonry">
                    ${this.state?.collections?.map((collection) => html`
                        <img class="${styles.image} item" src="${collection.image.url}" />
                    `).join('')}
                </div>
                <div data-name="pagination"></div>
            </div>
        `;
    }
}
