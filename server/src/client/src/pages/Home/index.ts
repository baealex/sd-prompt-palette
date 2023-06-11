import styles from './Home.module.scss';

import { Component, html, htmlToElement } from '~/modules/core';
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
            const keyword = $target.textContent.trim();
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
            this.$el.appendChild(htmlToElement(html`
                <div id="category-${category.id}" class="${styles.category}">
                    <div class="${styles.categoryHeader}">
                        <h2>${category.name}</h2>
                        <button>
                            copy all
                        </button>
                    </div>
                    <ul>
                        ${category.keywords.map(({ keyword: item }) => html`
                            <li data-id="${item.id}" data-category-id="${category.id}">
                                ${item.name}
                            </li>
                        `).join('')}
                    </ul>
                    <form name="${category.id}" class="${styles.form}">
                        <input type="text" name="keyword" placeholder="Keyword">
                        <button type="submit">+</button>
                    </form>
                </div>
            `));

            const $wrapper = this.useSelector(`#category-${category.id}`);
            const $copyAll = $wrapper.querySelector('button');
            const $items = $wrapper.querySelector('ul');
            const $form = $wrapper.querySelector('form');

            $copyAll.addEventListener('click', () => {
                const keywords = Array.from($items.querySelectorAll('li')).map((item) => item.textContent.trim());
                navigator.clipboard.writeText(keywords.join(', '));
                snackBar('😍 Copied to clipboard');
            });

            $form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const formData = new FormData($form);
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
                            categoryId: category.id,
                            name: item.slice(0, 50).toLowerCase(),
                        });
                        $items.appendChild(htmlToElement(html`
                            <li data-id="${data.id}" data-category-id="${category.id}">
                                ${data.name}
                            </li>
                        `));
                    } catch (error) {
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
