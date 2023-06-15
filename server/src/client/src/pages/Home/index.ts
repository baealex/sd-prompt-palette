import styles from './Home.module.scss';
import icon from '~/icon';

import { Component, html } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { getCategories, createKeyword, deleteKeyword, updateCategory, deleteCategory, imageUpload, createSampleImage, deleteSampleImage } from '~/api';
import { Header } from '~/components/Header';
import { contextMenu } from '~/modules/ui/context-menu';
import { createFormState } from '~/modules/form';

interface State {
    categories?: {
        id: number;
        name: string;
        keywords: {
            id: number;
            name: string;
            image?: {
                id: number;
                url: string;
            }
        }[];
    }[];
}

const formState = createFormState();

const memo: State = {
    categories: [],
};

export class Home extends Component<HTMLDivElement, State> {
    constructor($parent: HTMLElement) {
        formState.reset();
        new Header($parent);
        super($parent, {
            className: styles.Home,
            initialState: memo,
        });

        getCategories().then(({ data: { allCategories } }) => {
            this.setState({ categories: allCategories });
        });
    }

    setState(nextState: State | ((prevState: State) => State)): void {
        super.setState(nextState);
        Object.assign(memo, this.state);
    }

    handleClickKeyword = async (e: MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'LI') {
            const $target = e.target as HTMLElement;
            const keyword = $target.textContent.trim();
            navigator.clipboard.writeText(keyword);
            snackBar('😍 Copied to clipboard');
        }
    };

    handleContextMenu = async (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const { name } = target.dataset;

        if (name === 'category') {
            contextMenu.create({
                top: e.clientY,
                left: e.clientX,
                menus: [
                    {
                        label: 'Rename',
                        click: async () => {
                            const name = prompt('Rename category', target.textContent.trim());
                            if (name === null) {
                                return;
                            }
                            const { categoryId } = target.dataset;
                            const { data } = await updateCategory({ id: Number(categoryId), name });
                            this.setState((state) => ({
                                categories: state.categories.map((category) => {
                                    if (Number(category.id) === Number(categoryId)) {
                                        return {
                                            ...category,
                                            name: data.updateCategory.name,
                                        };
                                    }
                                    return category;
                                }),
                            }));
                            snackBar('😍 Renamed');
                        },
                    },
                    {
                        label: 'Delete',
                        click: async () => {
                            const { categoryId } = target.dataset;
                            await deleteCategory({ id: Number(categoryId) });
                            this.setState((state) => ({
                                categories: state.categories
                                    .filter((category) => Number(category.id) !== Number(categoryId)),
                            }));
                            snackBar('😭 Deleted');
                        },
                    },
                ]
            });
        }

        if (name === 'keyword') {
            contextMenu.create({
                top: e.clientY,
                left: e.clientX,
                menus: [
                    {
                        label: 'Delete',
                        click: async () => {
                            const {
                                id,
                                categoryId,
                            } = target.dataset;
                            try {
                                await deleteKeyword({
                                    keywordId: Number(id),
                                    categoryId: Number(categoryId),
                                });
                                this.setState((state) => ({
                                    categories: state.categories.map((category) => {
                                        if (Number(category.id) === Number(categoryId)) {
                                            return {
                                                ...category,
                                                keywords: category.keywords.filter((keyword) => Number(keyword.id) !== Number(id)),
                                            };
                                        }
                                        return category;
                                    }),
                                }));
                                snackBar('😭 Deleted');
                            } catch (err) {
                                snackBar('😭 Failed to delete');
                            }
                        }
                    },
                    {
                        label: 'Upload Sample Image',
                        click: async () => {
                            const { id } = target.dataset;

                            const $image = this.useSelector<HTMLInputElement>('[data-name="image"]');
                            $image.click();
                            $image.onchange = async () => {
                                const file = $image.files[0];
                                const reader = new FileReader();
                                reader.onload = async (e) => {
                                    try {
                                        const { data } = await imageUpload({ image: e.target.result.toString() });
                                        await createSampleImage({
                                            imageId: data.id,
                                            keywordId: Number(id),
                                        });
                                        this.setState((state) => ({
                                            categories: state.categories.map((category) => {
                                                return {
                                                    ...category,
                                                    keywords: category.keywords.map((keyword) => {
                                                        if (Number(keyword.id) === Number(id)) {
                                                            return {
                                                                ...keyword,
                                                                image: {
                                                                    id: data.id,
                                                                    url: data.url,
                                                                },
                                                            };
                                                        }
                                                        return keyword;
                                                    }),
                                                };
                                            }),
                                        }));
                                        snackBar('😍 Sample image uploaded');
                                    } catch (e) {
                                        snackBar('😥 Failed to upload sample image');
                                    }
                                };
                                reader.readAsDataURL(file);
                            };
                        }
                    }]
                    .concat(target.dataset.hasImage === 'true' ? [{
                        label: 'Delete Sample Image',
                        click: async () => {
                            const { id } = target.dataset;
                            try {
                                await deleteSampleImage({
                                    id: Number(id),
                                });
                                this.setState((state) => ({
                                    categories: state.categories.map((category) => {
                                        return {
                                            ...category,
                                            keywords: category.keywords.map((keyword) => {
                                                if (Number(keyword.id) === Number(id)) {
                                                    return {
                                                        ...keyword,
                                                        image: undefined,
                                                    };
                                                }
                                                return keyword;
                                            }),
                                        };
                                    }),
                                }));
                                snackBar('😭 Deleted sample image');
                            } catch (err) {
                                snackBar('😭 Failed to delete sample image');
                            }
                        }
                    }] : []),
            });
        }
    };

    handleSubmit = async (e) => {
        e.preventDefault();

        const { categoryId } = (e.target as HTMLElement).dataset;

        const formData = new FormData(e.target);
        const keyword = formData.get('keyword') as string;

        if (keyword.trim() === '') {
            snackBar('😭 Please enter a keyword');
            return;
        }

        for (const item of keyword.split(',').map((item) => item.trim())) {
            if (item === '') {
                continue;
            }

            try {
                const { data } = await createKeyword({
                    categoryId: Number(categoryId),
                    name: item.slice(0, 50).toLowerCase(),
                });
                formState.set(categoryId, '');
                formState.set('focused', categoryId);
                this.setState((state) => {
                    return {
                        ...state,
                        categories: state.categories.map((category) => {
                            if (Number(category.id) === Number(categoryId)) {
                                return {
                                    ...category,
                                    keywords: [
                                        ...category.keywords,
                                        {
                                            id: data.createKeyword.id,
                                            name: data.createKeyword.name,
                                        },
                                    ],
                                };
                            }
                            return category;
                        }),
                    };
                });
            } catch (error) {
                continue;
            }
        }
        e.target.reset();
    };

    handleCopyKeywords = async (e) => {
        const { categoryId } = (e.target as HTMLElement).dataset;

        const keywords = this.state?.categories?.find((category) => {
            return Number(category.id) === Number(categoryId);
        })?.keywords?.map(({ name }) => name).join(', ');

        if (keywords === undefined) {
            return;
        }

        navigator.clipboard.writeText(keywords);
        snackBar('😍 Copied to clipboard');
    };

    async mount() {
        document.title = 'SD Prompt Palette';

        this.$el.addEventListener('click', this.handleClickKeyword);
        this.$el.addEventListener('contextmenu', this.handleContextMenu);
        this.$el.querySelectorAll('form').forEach(($form) => {
            const $input = $form.querySelector('input');
            $input.value = formState.get($form.dataset.categoryId) || '';
            if (formState.get('focused') === $form.dataset.categoryId) {
                $input.focus();
                formState.set('focused', '');
            }
            $input.addEventListener('change', (e) => {
                formState.set($form.dataset.categoryId, (e.target as HTMLInputElement).value);
            });
            $form.addEventListener('submit', this.handleSubmit);
        });
        this.$el.querySelectorAll('button[data-action="copy"]').forEach(($button) => {
            $button.addEventListener('click', this.handleCopyKeywords);
        });
    }

    unmount() {
        this.$el.removeEventListener('click', this.handleClickKeyword);
        this.$el.removeEventListener('contextmenu', this.handleContextMenu);
        this.$el.querySelectorAll('form').forEach(($form) => {
            $form.removeEventListener('submit', this.handleSubmit);
        });
        this.$el.querySelectorAll('button[data-action="copy"]').forEach(($button) => {
            $button.removeEventListener('click', this.handleCopyKeywords);
        });
    }

    render() {
        return html`
            ${this.state?.categories?.map((category) => html`
                <div class="${styles.category}">
                    <div class="${styles.categoryHeader}">
                        <h2 data-name="category" data-category-id="${category.id}">
                            ${category.name}
                        </h2>
                        <button
                            type="button"
                            class="secondary-button"
                            data-action="copy"
                            data-category-id="${category.id}"
                        >
                            ${icon.draft} copy all
                        </button>
                    </div>
                    <ul>
                        ${category.keywords.map(({ id, name, image }) => html`
                            <li
                                data-name="keyword"
                                data-id="${id}"
                                data-category-id="${category.id}"
                                data-has-image="${image ? 'true' : 'false'}"
                            >
                                ${name}
                                ${image && html`
                                    <img src="${image?.url}" alt="${name}" loading="lazy">
                                `}
                            </li>
                        `).join('')}
                    </ul>
                    <form
                        name="${category.id}"
                        class="${styles.form}"
                        data-category-id="${category.id}"
                    >
                        <input
                            type="text"
                            name="keyword"
                            placeholder="Enter a keyword"
                        >
                        <button type="submit" class="primary-button">
                            add ${icon.plus}
                        </button>
                    </form>
                </div>
            `).join('')}
            <input type="file" data-name="image" accept="image/*" hidden>
        `;
    }
}
