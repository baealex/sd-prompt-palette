<script lang="ts">
    import { onMount } from "svelte";

    import type { Collection } from "../models/types";

    import CategoryHeader from "../components/CategoryHeader.svelte";
    import CollectionNav from "../components/CollectionNav.svelte";
    import KeywordsList from "../components/KeywordsList.svelte";
    import Delete from "../icons/Delete.svelte";

    import { useMemo } from "../modules/memo";
    import { snackBar } from "../modules/snack-bar";

    import { deleteCollection, getCollections } from "../api";

    import pathStore from "../store/path";

    onMount(() => {
        pathStore.set({ colllection: "/collection" });
    });

    let page = 1;
    const limit = 9999;
    const collections = useMemo<Collection[]>({
        key: ["collections", page],
        defaultValue: [],
    });

    getCollections({ page, limit }).then(({ data }) => {
        collections.value = data.allCollections;
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this collection?")) {
            await deleteCollection({ id });
            collections.value = collections.value.filter((c) => c.id !== id);
            snackBar("Deleted collection");
        }
    };
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each collections.value as collection}
            <div class="item">
                <div class="header">
                    <h2>{collection.title}</h2>
                    <button
                        class="primary-button"
                        on:click={() => handleDelete(collection.id)}
                    >
                        <Delete />
                        Remove
                    </button>
                </div>
                <img
                    class="image"
                    src={collection.image.url}
                    alt={collection.title}
                />
                <div class="body">
                    <CategoryHeader
                        title="Prompt"
                        onClickCopy={() => handleCopyText(collection.prompt)}
                    />
                    <KeywordsList
                        keywords={collection.prompt.split(",").map((p) => ({
                            id: Math.random(),
                            name: p.trim(),
                        }))}
                        onClick={(keyword) => handleCopyText(keyword.name)}
                    />
                    <CategoryHeader
                        title="Negative Prompt"
                        onClickCopy={() =>
                            handleCopyText(collection.negativePrompt)}
                    />
                    <KeywordsList
                        keywords={collection.negativePrompt
                            .split(",")
                            .map((p) => ({
                                id: Math.random(),
                                name: p.trim(),
                            }))}
                        onClick={(keyword) => handleCopyText(keyword.name)}
                    />
                </div>
            </div>
        {/each}
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
