import styles from './Home.module.scss';

import { Component, html } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { getCategories, createKeyword, deleteKeyword, updateCategory, deleteCategory } from '~/api';
import { Header } from '~/components/Header';
import { contextMenu } from '~/modules/ui/context-menu';

export class Home extends Component {
    constructor($parent: HTMLElement) {
        new Header($parent);
        super($parent, { className: styles.Home });
    }

    handleClickKeyword = async (e: any) => {
        if (e.target.tagName === 'LI') {
            const $target = e.target as HTMLElement;
            const keyword = $target.textContent;
            navigator.clipboard.writeText(keyword);
            snackBar('😍 Copied to clipboard');
        }
    };

    handleContextMenu = async (e: any) => {
        if (e.target.tagName === 'LI') {
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
                            } = e.target.dataset;
                            await deleteKeyword(Number(id), {
                                categoryId: Number(categoryId),
                            });
                            e.target.remove();
                            snackBar('😭 Deleted');
                        },
                    },
                ]
            });
        }
        if (e.target.tagName === 'H2') {
            contextMenu.create({
                top: e.clientY,
                left: e.clientX,
                menus: [
                    {
                        label: 'Rename',
                        click: async () => {
                            const name = prompt('Rename category', e.target.textContent);
                            if (name === null) {
                                return;
                            }
                            const { id } = e.target.parentElement;
                            await updateCategory(Number(id), { name });
                            e.target.textContent = name;
                            snackBar('😍 Renamed');
                        },
                    },
                    {
                        label: 'Delete',
                        click: async () => {
                            const { id } = e.target.parentElement;
                            await deleteCategory(Number(id));
                            e.target.parentElement.remove();
                            snackBar('😭 Deleted');
                        },
                    },
                ]
            });
        }
    };

    async mount() {
        const { data: categories } = await getCategories();

        categories.forEach((category) => {
            const categoryWrap = document.createElement('div');
            Object.assign(categoryWrap, {
                id: category.id,
                className: styles.category,
            });

            categoryWrap.innerHTML += html`
                <h2>${category.name}</h2>
            `;

            categoryWrap.innerHTML += html`
                <ul>
                    ${category.keywords.map(({ keyword: item }) => html`
                        <li data-id="${item.id}" data-category-id="${category.id}">${item.name}</li>
                    `).join('')}
                </ul>
            `;

            categoryWrap.innerHTML += html`
                <form name="${category.id}" class="${styles.form}">
                    <input type="text" name="keyword" placeholder="Keyword">
                    <button type="submit">+</button>
                </form>
            `;

            this.$el.appendChild(categoryWrap);
        });

        document.querySelectorAll('form').forEach(($form) => {
            $form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const formData = new FormData($form);
                const keyword = formData.get('keyword') as string;

                if (keyword.trim() === '') {
                    snackBar('😭 Please enter a keyword');
                    return;
                }

                const $category = document.getElementById($form.name);
                const $categoryItems = $category.querySelector('ul');

                for (const item of keyword.split(',').map((item) => item.trim())) {
                    if (item === '') {
                        continue;
                    }

                    try {
                        const { data: keyword } = await createKeyword({
                            categoryId: Number($form.name),
                            name: item.slice(0, 50).toLowerCase(),
                        });
                        $categoryItems.innerHTML += html`
                            <li data-id="${keyword.id}" data-category-id="${$form.name}">${keyword.name}</li>
                        `;
                    } catch (e) {
                        continue;
                    }
                }

                $form.reset();
            });
        });

        this.$el.addEventListener('click', this.handleClickKeyword);
        this.$el.addEventListener('contextmenu', this.handleContextMenu);
    }

    unmount() {
        this.$el.removeEventListener('click', this.handleClickKeyword);
        this.$el.removeEventListener('contextmenu', this.handleContextMenu);
    }

    render() {
        return html``;
    }
}
