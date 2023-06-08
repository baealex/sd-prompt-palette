import styles from './Manage.module.scss';

import { Header } from '~/components/Header';

import { Component, html } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';
import { useRouter } from '~/modules/core/router';

import { createCategory } from '~/api';

export class Manage extends Component {
    constructor($parent: HTMLElement) {
        new Header($parent);
        super($parent, { className: styles.Manage });
    }

    async mount() {
        const router = useRouter();
        const categoryWrap = document.createElement('div');
        categoryWrap.innerHTML += html`
            <h2>Add Category</h2>
            <form>
                <input type="text" name="category" placeholder="Category">
                <button type="submit">+</button>
            </form>
        `;
        this.$el.appendChild(categoryWrap);

        categoryWrap.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(this.useSelector('form'));
            const category = formData.get('category') as string;

            if (category.trim() === '') {
                snackBar('😭 Please enter a category');
                return;
            }

            try {
                await createCategory({ name: category });
                router.push('/');
            } catch (error) {
                snackBar('😭 Something went wrong');
            }
        });
    }

    render() {
        return html``;
    }
}
