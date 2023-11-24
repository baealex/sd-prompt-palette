<script lang="ts">
    import { onDestroy, onMount, afterUpdate } from "svelte";
    import { derived, get } from "svelte/store";
    import { Link } from "svelte-routing";

    import { CollectionNav, Image } from "~/components";

    import { collectionState } from "~/models/collection";
    import type { CollectionState } from "~/models/collection";

    import { useMemoState } from "~/modules/memo";

    import pathStore from "~/store/path";

    import { getCollections } from "~/api";

    let page = 1;
    const limit = 9999;
    let [collections, memoCollections] = useMemoState<CollectionState[]>(
        ["collections", page],
        [],
    );

    let grid: HTMLDivElement;

    $: resolveCollections = derived(collections, () =>
        collections.map((collection) => ({
            ...collection,
            ...get(collection),
        })),
    );

    onMount(() => {
        pathStore.set({ colllection: "/collection/gallery" });

        getCollections({ page, limit }).then(({ data }) => {
            collections = data.allCollections.map(collectionState);
        });
    });

    afterUpdate(() => {
        if (grid && grid.children.length) {
            // @ts-ignore
            new Masonry(grid, {
                itemSelector: ".grid-item",
                columnWidth: 360,
                gutter: 16,
                fitWidth: true,
            });
        }
    });

    onDestroy(() => {
        memoCollections(collections);
    });
</script>

<div class="container">
    <CollectionNav />
    <div bind:this={grid} class="grid">
        {#each $resolveCollections as collection}
            <div
                class="grid-item"
                style={`
                    width: 360px;
                    height: ${
                        (collection.image.height / collection.image.width) * 360
                    }px;
                `}
            >
                <Link to={`/collection/${collection.id}`}>
                    <Image
                        className="image"
                        timeout={250}
                        width={collection.image.width}
                        height={collection.image.height}
                        src={collection.image.url}
                        alt={collection.title}
                    />
                </Link>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    :global(.grid) {
        width: 100%;
        margin: 0 auto;
    }

    :global(.gird:after) {
        content: "";
        display: block;
        clear: both;
    }

    :global(.grid-item) {
        float: left;
        margin-bottom: 16px;
    }

    :global(.image) {
        position: relative;
        display: inline-block;
        width: 100%;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
    }
</style>
