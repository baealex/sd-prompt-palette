import styles from './ImageLoad.module.scss';

import { Header, Prompts } from '~/components';

import { Component, html, htmlToElement } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

import { createCollection, imageUpload } from '~/api';

const INITIAL_PROMPTS_STATE = {
    prompts: [],
    onClick: (e: any) => {
        const keyword = e.target.textContent;
        navigator.clipboard.writeText(keyword);
        snackBar('😍 Copied to clipboard');
    }
};

const memo = {
    image: null as File,
};

export class ImageLoad extends Component {
    $imageLoader: HTMLDivElement;
    $imagePreview: HTMLImageElement;
    $imageInput: HTMLInputElement;
    $promptContainer: HTMLUListElement;
    $prompts: Prompts;
    $negativePrompts: Prompts;

    constructor($parent: HTMLElement) {
        new Header($parent);
        super($parent, { className: styles.ImageLoad });
    }

    showPreview = (file: File) => {
        const image = document.createElement('img');
        image.src = URL.createObjectURL(file);
        this.$imagePreview.replaceChildren(image);
    };

    readPrompt = (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (e) => {
            const [_, data] = e.target.result.toString().split(',');
            const decodedData = atob(data);

            if (!decodedData.includes('parameters') || !decodedData.includes('Steps:')) {
                snackBar('😥 Cannot find prompt info');
                this.$prompts.setState({ prompts: [] });
                this.$negativePrompts.setState({ prompts: [] });
                return;
            }

            const promptInfo = decodedData
                .split('parameters')[1]
                .split('Steps:')[0]
                .slice(1, -1);
            const [
                prompt,
                negativePrompt
            ] = promptInfo.split('Negative prompt:').map((v) => v.trim());

            const createPrompts = (prompt: string) => {
                return prompt
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v);
            };

            this.$prompts.setState({
                prompts: prompt ? createPrompts(prompt) : []
            });
            this.$negativePrompts.setState({
                prompts: negativePrompt ? createPrompts(negativePrompt) : []
            });
        };
    };

    handleImageChange = async () => {
        const files = this.$imageInput.files;
        if (files.length > 0) {
            this.showPreview(files[0]);
            this.readPrompt(files[0]);
            memo.image = files[0];
        }
    };

    handleImageLoaderClick = () => {
        this.$imageInput.click();
    };


    handleImageLoaderDrag = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    handleImageLoaderDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.showPreview(files[0]);
            this.readPrompt(files[0]);
            memo.image = files[0];
        }
    };

    async mount() {
        document.title = 'Image Load | SD Prompt Palette';

        this.$imageLoader = this.useSelector(`.${styles.imageLoader}`);
        this.$imagePreview = this.useSelector(`.${styles.imagePreview}`);
        this.$imageInput = this.$imageLoader.querySelector('input[type="file"]');
        this.$promptContainer = this.useSelector(`.${styles.promptContainer}`);
        this.$promptContainer.appendChild(htmlToElement(html`
            <div class="${styles.categoryHeader}">
                <h2>Prompt</h2>
                <button id="copy-all">
                    copy all
                </button>
            </div>
        `));
        this.$prompts = new Prompts(this.$promptContainer, INITIAL_PROMPTS_STATE);
        this.$promptContainer.appendChild(htmlToElement(html`
            <div class="${styles.categoryHeader}" style="margin-top: 2rem;">
                <h2>Negative Prompt</h2>
                <button id="copy-all-negative">
                    copy all
                </button>
            </div>
        `));
        this.$negativePrompts = new Prompts(this.$promptContainer, INITIAL_PROMPTS_STATE);
        this.$promptContainer.appendChild(htmlToElement(html`
            <button id="save-to-collection">
                Save to collection
            </button>
        `));

        this.$imageInput.addEventListener('change', this.handleImageChange);
        this.$imageLoader.addEventListener('click', this.handleImageLoaderClick);
        this.$imageLoader.addEventListener('dragover', this.handleImageLoaderDrag);
        this.$imageLoader.addEventListener('drop', this.handleImageLoaderDrop);
        this.$promptContainer.querySelector('#copy-all').addEventListener('click', () => {
            const prompts = this.$prompts.state.prompts;
            navigator.clipboard.writeText(prompts.join(', '));
            snackBar('😍 Copied to clipboard');
        });
        this.$promptContainer.querySelector('#copy-all-negative').addEventListener('click', () => {
            const prompts = this.$negativePrompts.state.prompts;
            navigator.clipboard.writeText(prompts.join(', '));
            snackBar('😍 Copied to clipboard');
        });
        this.$promptContainer.querySelector('#save-to-collection').addEventListener('click', async () => {
            const prompts = this.$prompts.state.prompts;
            const negativePrompts = this.$negativePrompts.state.prompts;
            const image = memo.image;

            if (!image || (prompts.length === 0 && negativePrompts.length === 0)) {
                snackBar('😥 Cannot find image or prompt');
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onload = async (e) => {
                const { data } = await imageUpload({ image: e.target.result.toString() });

                const title = prompt('Input collection title') || '';

                await createCollection({
                    title,
                    imageId: data.id,
                    prompt: prompts.join(', '),
                    negativePrompt: negativePrompts.join(', '),
                });
                snackBar('😍 Saved to collection');
            };
        });

        if (memo.image) {
            this.readPrompt(memo.image);
            this.showPreview(memo.image);
        }

    }

    unmount() {
        this.$prompts.unmount();
        this.$negativePrompts.unmount();
        this.$imageInput.removeEventListener('change', this.handleImageChange);
        this.$imageLoader.removeEventListener('click', this.handleImageLoaderClick);
        this.$imageLoader.removeEventListener('dragover', this.handleImageLoaderDrag);
        this.$imageLoader.removeEventListener('drop', this.handleImageLoaderDrop);
    }


    render() {
        return html`
            <div class="${styles.grid}">
                <div class="${styles.imageLoader}">
                    <input type="file" accept="image/*" style="display: none;" />
                    <div class="${styles.imagePreview}">
                        이미지를 끌어 놓으세오
                        <span>-또는-</span>
                        클릭해서 업로드하기
                    </div>
                </div>
                <div class="${styles.promptContainer}"></div>
            </div>
        `;
    }
}
