import { BaseModel } from './base-model';
import type { Collection, Image } from './types';

import { graphQLRequest } from '../api';

import { snackBar } from '../modules/ui/snack-bar';
import { contextMenu } from '../modules/ui/context-menu';

export class CollectionModel extends BaseModel<Collection> {
    id: number;
    image: Image;
    title: string;
    prompt: string;
    negativePrompt: string;

    constructor(state: Collection) {
        super();

        this.id = state.id;
        this.title = state.title;
        this.image = state.image;
        this.prompt = state.prompt;
        this.negativePrompt = state.negativePrompt;
    }

    async updateTitle(newTitle: string) {
        const { data } = await graphQLRequest<'updateCollection', Pick<Collection, 'title'>>(`
            mutation {
                updateCollection(id: ${this.id}, title: "${newTitle}") {
                    title
                }
            }
        `);
        this.setState({ ...this, title: data.updateCollection.title });
    }

    async delete() {
        if (confirm('Are you sure you want to delete this collection?')) {
            try {
                await graphQLRequest<'deleteCollection', boolean>(`
                    mutation {
                        deleteCollection(id: ${this.id})
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
    }

    async contextMenu(e: MouseEvent) {
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
                            this.title,
                        );
                        if (title) {
                            this.updateTitle(title);
                        }
                    },
                },
                {
                    label: 'Delete',
                    click: () => {
                        this.delete();
                    },
                },
            ],
        });
    }

    static from(state: Collection) {
        return new CollectionModel(state);
    }
}