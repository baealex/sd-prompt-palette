<script lang="ts">
    import { onMount } from "svelte";
    import pathStore from "../store/path";
    import CollectionNav from "../components/CollectionNav.svelte";

    import type { Collection } from "../models/types";

    import { getCollections } from "../api";
    import { Link } from "svelte-routing";
    import { useMemo } from "../modules/memo";

    onMount(() => {
        pathStore.set({ colllection: "/collection/galley" });
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
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each collections.value as collection}
            <Link to={`/collection/${collection.id}`}>
                <img
                    class="image"
                    src={collection.image.url}
                    alt={collection.title}
                />
            </Link>
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
