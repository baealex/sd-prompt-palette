<script lang="ts">
    import CategoryHeader from "../components/CategoryHeader.svelte";
    import KeywordsList from "../components/KeywordsList.svelte";
    import Delete from "../icons/Delete.svelte";

    import type { Collection } from "../models/types";
    import { snackBar } from "../modules/snack-bar";
    import { useMemo } from "../modules/memo";

    import { deleteCollection, getCollection } from "../api";

    export let id;

    const collection = useMemo<Collection>({
        key: ["collection", id],
        defaultValue: null,
    });

    getCollection({ id }).then(({ data }) => {
        collection.value = data.collection;
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this collection?")) {
            await deleteCollection({ id });
        }
    };
</script>

<div class="container">
    <div class="collection">
        {#if collection.value == null}
            <p>Loading...</p>
        {:else}
            <div class="item" data-name="collection">
                <div class="header">
                    <h2>{collection.value.title}</h2>
                    <button
                        class="primary-button"
                        on:click={() => handleDelete(collection.value.id)}
                    >
                        <Delete />
                        Remove
                    </button>
                </div>
                <img
                    class="image"
                    src={collection.value.image.url}
                    alt={collection.value.title}
                />
                <div class="body">
                    <CategoryHeader
                        title="Prompt"
                        onClickCopy={() =>
                            handleCopyText(collection.value.prompt)}
                    />
                    <KeywordsList
                        keywords={collection.value.prompt
                            .split(",")
                            .map((p) => ({
                                id: Math.random(),
                                name: p.trim(),
                            }))}
                        onClick={(keyword) => handleCopyText(keyword.name)}
                    />
                    <CategoryHeader
                        title="Negative Prompt"
                        onClickCopy={() =>
                            handleCopyText(collection.value.negativePrompt)}
                    />
                    <KeywordsList
                        keywords={collection.value.negativePrompt
                            .split(",")
                            .map((p) => ({
                                id: Math.random(),
                                name: p.trim(),
                            }))}
                        onClick={(keyword) => handleCopyText(keyword.name)}
                    />
                </div>
            </div>
        {/if}
    </div>
</div>

<style lang="scss">
    .container {
        padding: 2rem;

        @media (max-width: 768px) {
            padding: 1rem;
        }
    }

    .collection {
        display: block;
    }

    .item {
        display: grid;
        grid-template-areas:
            "header header"
            "image body";
        width: 100%;
        margin-bottom: 1.5rem;
        border: 1px solid #aaa;
        border-radius: 0.5rem;
        align-items: center;

        &:nth-child(even) {
            grid-template-areas:
                "header header"
                "body image";
        }

        .header {
            grid-area: header;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #aaa;
            padding: 0 1.5rem;
        }

        .image {
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

            &:nth-child(even) {
                grid-template-areas:
                    "header"
                    "image"
                    "body";
            }

            .image {
                width: 100%;
            }
        }
    }
</style>
