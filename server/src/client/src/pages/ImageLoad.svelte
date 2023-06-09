<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { createCollection, imageUpload } from "../api";
    import CategoryHeader from "../components/CategoryHeader.svelte";
    import KeywordsList from "../components/KeywordsList.svelte";
    import Heart from "../icons/Heart.svelte";

    import { imageToBase64, readPromptInfo } from "../modules/image";
    import { useMemoState } from "../modules/memo";
    import { snackBar } from "../modules/ui/snack-bar";

    let inputRef: HTMLInputElement;
    let imageRef: HTMLImageElement;
    let helpRef: HTMLDivElement;

    let [loader, memoLoader] = useMemoState<{
        image: File;
        promptText: string;
        negativePromptText: string;
    }>("image-load", {
        image: null,
        promptText: "",
        negativePromptText: "",
    });

    onMount(() => {
        if (loader.image) {
            helpRef.style.display = "none";
            imageRef.style.display = "block";
            imageRef.src = URL.createObjectURL(loader.image);
        }
    });

    onDestroy(() => {
        memoLoader(loader);
    });

    const cleanPromptText = (text: string) => {
        return text
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
            .join(", ");
    };

    const loadImage = async () => {
        helpRef.style.display = "none";
        imageRef.style.display = "block";
        imageRef.src = URL.createObjectURL(loader.image);

        const base64 = await imageToBase64(loader.image);
        readPromptInfo(base64, {
            onError: (err) => {
                loader = {
                    ...loader,
                    promptText: "",
                    negativePromptText: "",
                };
                snackBar(err);
            },
            onSuccess: (info) => {
                loader = {
                    ...loader,
                    promptText: cleanPromptText(info.prompt),
                    negativePromptText: cleanPromptText(info.negativePrompt),
                };
            },
        });
    };

    const handleClickLoader = () => {
        inputRef.click();
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const handleDropImage = (e: DragEvent) => {
        e.preventDefault();
        loader.image = e.dataTransfer.files[0];
        loadImage();
    };

    const handleChangeImage = async (e: Event) => {
        loader.image = (e.target as HTMLInputElement).files[0];
        loadImage();
    };

    const handleSave = async () => {
        if (
            !loader.image ||
            (!loader.promptText && !loader.negativePromptText)
        ) {
            snackBar("Please load an sd image first");
            return;
        }

        const { data } = await imageUpload({
            image: await imageToBase64(loader.image),
        });

        const title = prompt("Enter a title for this collection") || "";

        await createCollection({
            imageId: data.id,
            title,
            prompt: cleanPromptText(loader.promptText),
            negativePrompt: cleanPromptText(loader.negativePromptText),
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
        <div
            class="image-preview"
            on:drag={handleDragOver}
            on:dragover={handleDragOver}
            on:drop={handleDropImage}
        >
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
            onClickCopy={() => handleCopyText(loader.promptText)}
        />
        <KeywordsList
            keywords={loader.promptText
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
            onClickCopy={() => handleCopyText(loader.negativePromptText)}
        />
        <KeywordsList
            keywords={loader.negativePromptText
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
    .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 2rem;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .image-loader {
        height: 500px;
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
            height: 500px;
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
