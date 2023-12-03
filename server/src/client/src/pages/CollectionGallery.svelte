<script lang="ts">
    import { onDestroy, onMount, afterUpdate } from "svelte";
    import { derived, get } from "svelte/store";
    import { Link, navigate, useLocation } from "svelte-routing";
    import Masonry from "masonry-layout";

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
        "collections",
        [],
    );

    let grid: HTMLDivElement;

    $: resolveCollections = derived(collections, () =>
        collections.map((collection) => ({
            ...collection,
            ...get(collection),
        })),
    );

    const loc = useLocation();
    const params = new URLSearchParams(location.search);

    onMount(() => {
        // @ts-ignore
        loc.subscribe((location) => {
            const params = new URLSearchParams(location.search);
            const query = params.get("query") || "";

            page = 1;
            getCollections({ page, limit, query }).then(({ data }) => {
                lastPage = Math.ceil(
                    data.allCollections.pagination.total / limit,
                );
                collections =
                    data.allCollections.collections.map(collectionState);
            });
        });

        pathStore.set({ collection: "/collection/gallery" });

        getCollections({ page, limit, query: params.get("query") || "" }).then(
            ({ data }) => {
                lastPage = Math.ceil(
                    data.allCollections.pagination.total / limit,
                );
                collections =
                    data.allCollections.collections.map(collectionState);

                document.addEventListener("scroll", () => {
                    const hasNext = page < lastPage;
                    const isBottom =
                        window.innerHeight + window.scrollY >=
                        document.body.offsetHeight - 100;
                    if (isBottom && hasNext) {
                        page += 1;

                        getCollections({
                            page,
                            limit,
                            query: params.get("query") || "",
                        }).then(({ data }) => {
                            collections = [
                                ...collections,
                                ...data.allCollections.collections.map(
                                    collectionState,
                                ),
                            ];
                        });
                    }
                });
            },
        );
    });

    afterUpdate(() => {
        if (grid && grid.children.length) {
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
    <div class="search">
        <input
            type="text"
            placeholder="Search"
            on:keydown={(e) => {
                if (e.key === "Enter") {
                    const query = e.currentTarget.value;
                    if (query) {
                        navigate(`/collection/gallery?query=${query}`);
                    } else {
                        navigate("/collection/gallery");
                    }
                }
            }}
        />
    </div>
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
                <a target="_blank" href={`/collection/${collection.id}`}>
                    <Image
                        className="image"
                        width={collection.image.width}
                        height={collection.image.height}
                        src={collection.image.url}
                        alt={collection.title}
                    />
                </a>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .search {
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
        margin-bottom: 16px;

        input {
            width: 100%;
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.25);
            outline: none;
            transition: border-color 0.25s ease-in-out;

            &:focus {
                border-color: rgba(0, 0, 0, 0.5);
            }
        }
    }

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
