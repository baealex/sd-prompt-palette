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
    let lastPage = 1;
    const limit = 20;
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
        pathStore.set({ collection: "/collection/gallery" });

        getCollections({ page, limit }).then(({ data }) => {
            lastPage = Math.ceil(data.allCollections.pagination.total / limit);
            collections = data.allCollections.collections.map(collectionState);

            document.addEventListener("scroll", () => {
                const hasNext = page < lastPage;
                const isBottom =
                    window.innerHeight + window.scrollY >=
                    document.body.offsetHeight;
                if (isBottom && hasNext) {
                    page += 1;

                    getCollections({ page, limit }).then(({ data }) => {
                        collections = [
                            ...collections,
                            ...data.allCollections.collections.map(
                                collectionState,
                            ),
                        ];
                    });
                }
            });
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
                <div class="title">
                    <Link to={`/collection/${collection.id}`}>
                        {collection.title}
                    </Link>
                </div>
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

        &:after {
            content: "";
            display: block;
            clear: both;
        }
    }

    :global(.grid-item) {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        float: left;
        margin-bottom: 16px;

        .title {
            position: absolute;
            opacity: 0;
            top: 0;
            left: 0;
            width: 100%;
            padding: 24px;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 600;
            text-align: center;
            background: rgba(0, 0, 0, 0.5);
            transform: translateY(-100%);
            transition:
                transform 0.25s ease-in-out,
                opacity 0.25s ease-in-out;
        }

        &:hover {
            .title {
                opacity: 1;
                transform: translateY(0);
            }
        }

        :global(.image) {
            width: 100%;
            height: auto;
            object-fit: contain;
        }
    }
</style>
