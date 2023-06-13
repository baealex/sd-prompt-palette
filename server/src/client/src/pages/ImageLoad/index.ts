import styles from './ImageLoad.module.scss';
import icon from '~/icon';

import { Header, Prompts } from '~/components';

import { Component, html } from '~/modules/core';
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

    handleCopyPrompt = () => {
        const prompts = this.$prompts.state.prompts;
        navigator.clipboard.writeText(prompts
            .join(', ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
        );
        snackBar('😍 Copied to clipboard');
    };

    handleCopyNegativePrompt = () => {
        const prompts = this.$negativePrompts.state.prompts;
        navigator.clipboard.writeText(prompts
            .join(', ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
        );
        snackBar('😍 Copied to clipboard');
    };

    handleSaveToCollection = async () => {
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
            try {
                const { data } = await imageUpload({ image: e.target.result.toString() });

                const title = prompt('Input collection title') || '';

                await createCollection({
                    title,
                    imageId: data.id,
                    prompt: prompts.join(', '),
                    negativePrompt: negativePrompts.join(', '),
                });
                snackBar('😍 Saved to collection');
            } catch (e) {
                snackBar('😥 Cannot save to collection');
            }
        };
    };


    async mount() {
        document.title = 'Image Load | SD Prompt Palette';

        window.requestAnimationFrame(() => {
            this.$imagePreview = this.useSelector(`.${styles.imagePreview}`);

            this.$imageLoader = this.useSelector(`.${styles.imageLoader}`);
            this.$imageLoader.addEventListener('click', this.handleImageLoaderClick);
            this.$imageLoader.addEventListener('dragover', this.handleImageLoaderDrag);
            this.$imageLoader.addEventListener('drop', this.handleImageLoaderDrop);

            this.$imageInput = this.useSelector('input[type="file"]');
            this.$imageInput.addEventListener('change', this.handleImageChange);

            this.$prompts = new Prompts(
                this.useSelector('[data-name="prompt"]'),
                INITIAL_PROMPTS_STATE
            );
            this.$negativePrompts = new Prompts(
                this.useSelector('[data-name="negative-prompt"]'),
                INITIAL_PROMPTS_STATE
            );

            this.useSelector('[data-name="copy-prompt"]').addEventListener('click', this.handleCopyPrompt);
            this.useSelector('[data-name="copy-negative-prompt"]').addEventListener('click', this.handleCopyNegativePrompt);
            this.useSelector('[data-name="save-to-collection"]').addEventListener('click', this.handleSaveToCollection);

            if (memo.image) {
                this.readPrompt(memo.image);
                this.showPreview(memo.image);
            }
        });
    }

    unmount() {
        this.$prompts.unmount();
        this.$negativePrompts.unmount();
        this.$imageInput.removeEventListener('change', this.handleImageChange);
        this.$imageLoader.removeEventListener('click', this.handleImageLoaderClick);
        this.$imageLoader.removeEventListener('dragover', this.handleImageLoaderDrag);
        this.$imageLoader.removeEventListener('drop', this.handleImageLoaderDrop);
        this.useSelector('[data-name="copy-prompt"]').removeEventListener('click', this.handleCopyPrompt);
        this.useSelector('[data-name="copy-negative-prompt"]').removeEventListener('click', this.handleCopyNegativePrompt);
        this.useSelector('[data-name="save-to-collection"]').removeEventListener('click', this.handleSaveToCollection);
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
                <div class="${styles.container}">
                    <div class="${styles.header}">
                        <h2>Prompt</h2>
                        <button class="secondary-button" data-name="copy-prompt">
                            ${icon.draft} copy all
                        </button>
                    </div>
                    <div data-name="prompt"></div>
                    <div class="${styles.header}">
                        <h2>Negative Prompt</h2>
                        <button class="secondary-button" data-name="copy-negative-prompt">
                            ${icon.draft} copy all
                        </button>
                    </div>
                    <div data-name="negative-prompt"></div>
                    <button
                        style="
                            display: inline-flex;
                            margin-top: 1rem;
                        "
                        class="primary-button"
                        data-name="save-to-collection"
                    >
                        ${icon.heart}
                        Save to collection
                    </button>
                </div>
            </div>
        `;
    }
}
