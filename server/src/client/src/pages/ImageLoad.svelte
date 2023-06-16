<script lang="ts">
    import { createCollection, imageUpload } from "../api";
    import CategoryHeader from "../components/CategoryHeader.svelte";
    import KeywordsList from "../components/KeywordsList.svelte";
    import Heart from "../icons/Heart.svelte";

    import { imageToBase64, readPromptInfo } from "../modules/image";
    import { snackBar } from "../modules/snack-bar";

    let inputRef: HTMLInputElement;
    let imageRef: HTMLImageElement;
    let helpRef: HTMLDivElement;
    let promptText = "";
    let negativePromptText = "";

    const handleClickLoader = () => {
        inputRef.click();
    };

    const handleChangeImage = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files[0];

        helpRef.style.display = "none";
        imageRef.style.display = "block";
        imageRef.src = URL.createObjectURL(file);

        const base64 = await imageToBase64(file);
        readPromptInfo(base64, {
            onError: (err) => {
                promptText = "";
                negativePromptText = "";
                snackBar(err);
            },
            onSuccess: (info) => {
                promptText = info.prompt
                    .split(",")
                    .filter((t) => t.trim())
                    .join(", ");
                negativePromptText = info.negativePrompt
                    .split(",")
                    .filter((t) => t.trim())
                    .join(", ");
            },
        });
    };

    const handleSave = async () => {
        const file = inputRef.files[0];

        if (!file || (!promptText && !negativePromptText)) {
            snackBar("Please load an sd image first");
            return;
        }

        const { data } = await imageUpload({
            image: await imageToBase64(file),
        });

        const title = prompt("Enter a title for this collection");
        await createCollection({
            imageId: data.id,
            title,
            prompt: promptText,
            negativePrompt: negativePromptText,
        });
        snackBar(`Saved collection: ${title}`);
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };
</script>

<div class="container grid">
    <div
        class="image-loader"
        on:click={handleClickLoader}
        on:keydown={handleClickLoader}
    >
        <div class="image-preview">
            <div bind:this={helpRef}>
                이미지를 끌어 놓으세요
                <span>-또는-</span>
                클릭해서 업로드하기
            </div>
            <img bind:this={imageRef} src="" alt="" style="display: none;" />
        </div>
        <input
            bind:this={inputRef}
            type="file"
            accept="image/*"
            style="display: none;"
            on:change={handleChangeImage}
        />
    </div>
    <div>
        <CategoryHeader
            title="Prompt"
            onClickCopy={() => handleCopyText(promptText)}
        />
        <KeywordsList
            keywords={promptText
                .split(",")
                .filter((p) => p.trim())
                .map((p) => ({
                    id: Math.random(),
                    name: p.trim(),
                }))}
            onClick={(keyword) => handleCopyText(keyword.name)}
        />
        <CategoryHeader
            title="Negative Prompt"
            onClickCopy={() => handleCopyText(negativePromptText)}
        />
        <KeywordsList
            keywords={negativePromptText
                .split(",")
                .filter((p) => p.trim())
                .map((p) => ({
                    id: Math.random(),
                    name: p.trim(),
                }))}
            onClick={(keyword) => handleCopyText(keyword.name)}
        />
        <button class="primary-button save" on:click={handleSave}>
            <Heart />
            Save to collection
        </button>
    </div>
</div>

<style lang="scss">
    .container {
        padding: 2rem;

        @media (max-width: 768px) {
            padding: 1rem;
        }
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 2rem;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .image-loader {
        height: 300px;
        border: 1px dashed #888;
        display: flex;
        justify-content: center;
        flex-direction: column;
        cursor: pointer;
    }

    .image-preview {
        color: #555;
        display: flex;
        flex-direction: column;
        text-align: center;
        align-items: center;

        img {
            max-width: 100%;
            height: 300px;
            object-fit: contain;
        }

        span {
            display: block;
            color: #aaa;
        }
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        h2 {
            margin: 0;
            padding: 0;
        }
    }
</style>
