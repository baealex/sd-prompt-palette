<script lang="ts">
    import CategoryHeader from "./CategoryHeader.svelte";
    import KeywordsList from "./KeywordsList.svelte";
    import Image from "./Image.svelte";

    import { Delete } from "~/icons";

    export let title: string;
    export let image: {
        url: string;
        width: number;
        height: number;
    };
    export let prompt: string;
    export let negativePrompt: string;
    export let onClickCopy: (text: string) => void;
    export let onClickDelete: () => void;
    export let onContextMenu: (e: MouseEvent) => void = null;

    const createKeywords = (text: string) =>
        text
            .split(",")
            .map((p) => ({
                id: Math.random(),
                name: p.trim(),
            }))
            .filter((p) => p.name);
</script>

<div class="item">
    <div class="header">
        <h2 on:contextmenu={onContextMenu}>{title}</h2>
        <button class="primary-button" on:click={onClickDelete}>
            <Delete />
            Remove
        </button>
    </div>
    <Image
        className="image"
        alt={title}
        src={image.url}
        width={image.width}
        height={image.height}
    />
    <div class="body">
        <CategoryHeader
            title="Prompt"
            onClickCopy={() => onClickCopy(prompt)}
        />
        <KeywordsList
            keywords={createKeywords(prompt)}
            onClick={(keyword) => onClickCopy(keyword.name)}
        />
        <CategoryHeader
            title="Negative Prompt"
            onClickCopy={() => onClickCopy(negativePrompt)}
        />
        <KeywordsList
            keywords={createKeywords(negativePrompt)}
            onClick={(keyword) => onClickCopy(keyword.name)}
        />
    </div>
</div>

<style lang="scss">
    .item {
        display: grid;
        grid-template-areas:
            "header header"
            "image body";
        grid-template-columns: 350px auto;
        width: 100%;
        margin-bottom: 1.5rem;
        border: 1px solid #aaa;
        border-radius: 0.5rem;
        align-items: center;

        &:nth-child(even) {
            grid-template-areas:
                "header header"
                "body image";
            grid-template-columns: auto 350px;
        }

        .header {
            grid-area: header;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            border-bottom: 1px solid #aaa;
            padding: 1.5rem;

            h2 {
                margin: 0;
            }
        }

        :global(.image) {
            padding: 1rem;
            border-radius: 1.5rem;
            grid-area: image;
            width: 350px;
            height: auto;
            object-fit: contain;
        }

        .body {
            grid-area: body;
            padding: 1.5rem;
        }

        @media (max-width: 768px) {
            width: 100%;
            grid-template-areas:
                "header"
                "image"
                "body";
            grid-template-columns: 1fr;

            &:nth-child(even) {
                grid-template-areas:
                    "header"
                    "image"
                    "body";
                grid-template-columns: 1fr;
            }

            .image {
                width: 100%;
            }
        }
    }
</style>
