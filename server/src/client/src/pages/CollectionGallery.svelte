<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { derived, get } from "svelte/store";

    import CollectionNav from "../components/CollectionNav.svelte";

    import { collectionState } from "../models/collection";
    import type { CollectionState } from "../models/collection";

    import { getCollections } from "../api";
    import { Link } from "svelte-routing";
    import { useMemoState } from "../modules/memo";

    import pathStore from "../store/path";

    let page = 1;
    const limit = 9999;
    let [collections, memoCollections] = useMemoState<CollectionState[]>(
        ["collections", page],
        []
    );

    $: resolveCollections = derived(collections, () =>
        collections.map((collection) => ({
            ...collection,
            ...get(collection),
        }))
    );

    onMount(() => {
        pathStore.set({ colllection: "/collection/gallery" });

        getCollections({ page, limit }).then(({ data }) => {
            collections = data.allCollections.map(collectionState);
        });
    });

    onDestroy(() => {
        memoCollections(collections);
    });
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each $resolveCollections as collection}
            <Link to={`/collection/${collection.id}`}>
                <img
                    class="image"
                    src={collection.image.url}
                    alt={collection.title}
                />
            </Link>
        {/each}
    </div>
</div>

<style lang="scss">
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
