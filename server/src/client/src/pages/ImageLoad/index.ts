import styles from './ImageLoad.module.scss';

import { Header } from '~/components/Header';

import { Component, html } from '~/modules/core';
import { snackBar } from '~/modules/ui/snack-bar';

export class ImageLoad extends Component {
    $imageLoader: HTMLDivElement;
    $imagePreview: HTMLImageElement;
    $imageInput: HTMLInputElement;
    $prompt: HTMLUListElement;
    $negativePrompt: HTMLUListElement;

    constructor($parent: HTMLElement) {
        new Header($parent);
        super($parent, { className: styles.ImageLoad });
    }

    async mount() {
        this.$imageLoader = this.useSelector(`.${styles.imageLoader}`);
        this.$imagePreview = this.useSelector(`.${styles.imagePreview}`);
        this.$imageInput = this.$imageLoader.querySelector('input[type="file"]');
        this.$prompt = this.useSelector('.prompt');
        this.$negativePrompt = this.useSelector('.negative-prompt');

        const showPreview = (file: File) => {
            const image = document.createElement('img');
            image.src = URL.createObjectURL(file);
            this.$imagePreview.replaceChildren(image);
        };

        const readPrompt = (file: File) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (e) => {
                const [_, data] = e.target.result.toString().split(',');
                const decodedData = atob(data);
                if (!decodedData.includes('parameters') || !decodedData.includes('Steps:')) {
                    snackBar('Cannot find prompt info');
                    return;
                }
                const promptInfo = decodedData
                    .split('parameters')[1]
                    .split('Steps:')[0]
                    .slice(1, -1);
                const [prompt, negativePrompt] = promptInfo.split('Negative prompt:').map((v) => v.trim());
                this.$prompt.innerHTML = prompt
                    ? prompt
                        .split(',')
                        .filter((v) => v)
                        .map((v) => html`<li>${v}</li>`).join('')
                    : '';
                this.$negativePrompt.innerHTML = negativePrompt
                    ? negativePrompt
                        .split(',')
                        .filter((v) => v)
                        .map((v) => html`<li>${v}</li>`).join('')
                    : '';
            };
        };


        this.$imageLoader.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.$imageLoader.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                showPreview(files[0]);
                readPrompt(files[0]);
            }
        });

        this.$imageLoader.addEventListener('click', (e) => {
            this.$imageInput.click();
        });

        this.$imageInput.addEventListener('change', (e) => {
            const files = this.$imageInput.files;
            if (files.length > 0) {
                showPreview(files[0]);
                readPrompt(files[0]);
            }
        });

        this.$el.addEventListener('click', (event: any) => {
            if (event.target.tagName === 'LI') {
                const keyword = event.target.textContent;
                navigator.clipboard.writeText(keyword);
                snackBar('😍 Copied to clipboard');
            }
        });
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
                <div>
                    <h3>Prompt</h3>
                    <ul class="prompt ${styles.propts}"></ul>
                    <h3>Negative Prompt</h3>
                    <ul class="negative-prompt ${styles.propts}"></ul>
                </div>
            </div>
        `;
    }
}
