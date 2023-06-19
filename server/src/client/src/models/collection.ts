import { Writable, writable } from 'svelte/store';

import type { Collection } from './types';

import { snackBar } from '../modules/ui/snack-bar';
import { contextMenu } from '../modules/ui/context-menu';

import { graphQLRequest } from '../api';

export function collectionModel(state: Collection) {
    const store = writable<Collection>(state);

    const methods = {
        async updateTitle(newTitle: string) {
            const { data } = await graphQLRequest<'updateCollection', Pick<Collection, 'title'>>(`
                mutation {
                    updateCollection(id: ${state.id}, title: "${newTitle}") {
                        title
                    }
                }
            `);

            state.title = data.updateCollection.title;

            store.update(_ => ({ ...state }));
        },
        async delete() {
            if (confirm('Are you sure you want to delete this collection?')) {
                try {
                    await graphQLRequest<'deleteCollection', boolean>(`
                        mutation {
                            deleteCollection(id: ${state.id})
                        }
                    `);
                    snackBar('Collection deleted');
                    return true;
                }
                catch (e) {
                    snackBar('Failed to delete collection');
                    console.error(e);
                    return false;
                }
            }
            return false;
        },
        contextMenu(e: MouseEvent) {
            e.preventDefault();

            contextMenu.create({
                top: e.clientY,
                left: e.clientX,
                menus: [
                    {
                        label: 'Rename',
                        click: () => {
                            const title = prompt(
                                'Enter a new title',
                                state.title,
                            );
                            if (title) {
                                this.updateTitle(title);
                            }
                        },
                    },
                    {
                        label: 'Remove',
                        click: () => {
                            this.delete();
                        },
                    },
                ],
            });
        },
    };

    return Object.assign(store, methods);
}

export type CollectionModel = Writable<Collection> & ReturnType<typeof collectionModel>;
