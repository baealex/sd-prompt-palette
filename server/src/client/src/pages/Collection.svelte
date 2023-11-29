<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { derived, get } from "svelte/store";
    import { toast } from "@baejino/ui";

    import { collectionState } from "~/models/collection";
    import type { CollectionState } from "~/models/collection";

    import { CollectionNav, CollectionCard } from "~/components";

    import { useMemoState } from "~/modules/memo";

    import { getCollections } from "~/api";

    import pathStore from "~/store/path";

    let page = 1;
    let lastPage = 1;
    const limit = 20;
    let [collections, memoCollections] = useMemoState<CollectionState[]>(
        ["collections", page],
        [],
    );

    $: resolveCollections = derived(collections, () =>
        collections.map((collection) => ({
            ...collection,
            ...get(collection),
        })),
    );

    onMount(() => {
        pathStore.set({ collection: "/collection" });

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

    onDestroy(() => {
        memoCollections(collections);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
    };

    const handleDelete = async (collection: CollectionState) => {
        const success = await collection.delete();
        if (success) {
            collections = collections.filter(
                (c) => get(c).id !== get(collection).id,
            );
        }
    };

    const handleContextMenu = (e: MouseEvent, collection: CollectionState) => {
        collection.contextMenu(e);
    };
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each $resolveCollections as collection}
            <CollectionCard
                title={collection.title}
                image={collection.image}
                prompt={collection.prompt}
                negativePrompt={collection.negativePrompt}
                onClickCopy={handleCopyText}
                onClickDelete={() => handleDelete(collection)}
                onContextMenu={(e) => handleContextMenu(e, collection)}
            />
        {/each}
    </div>
</div>
