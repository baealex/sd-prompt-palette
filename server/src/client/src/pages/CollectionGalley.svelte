<script lang="ts">
    import { onMount } from "svelte";
    import pathStore from "../store/path";
    import CollectionNav from "../components/CollectionNav.svelte";

    import type { Collection } from "../models/types";

    import { getCollections } from "../api";

    onMount(() => {
        pathStore.set({ colllection: "/collection/galley" });
    });

    let collections: Collection[] = [];
    let page = 1;
    const limit = 9999;

    getCollections({ page, limit }).then(({ data }) => {
        collections = data.allCollections;
    });
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each collections as collection}
            <img
                class="image"
                src={collection.image.url}
                alt={collection.title}
            />
        {/each}
        <div data-name="pagination" />
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
        column-width: 350px;
        column-gap: 16px;

        .image {
            position: relative;
            display: inline-block;
            width: 100%;
            height: auto;
            object-fit: contain;
            margin-bottom: 16px;
            border-radius: 8px;
        }
    }
</style>
