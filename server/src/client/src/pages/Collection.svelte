<script lang="ts">
    import { afterUpdate, onDestroy, onMount } from "svelte";

    import { CollectionModel } from "../models/collection";

    import CollectionNav from "../components/CollectionNav.svelte";
    import CollectionCard from "../components/CollectionCard.svelte";

    import { useMemoState } from "../modules/memo";
    import { snackBar } from "../modules/ui/snack-bar";

    import { getCollections } from "../api";

    import pathStore from "../store/path";

    let page = 1;
    const limit = 9999;
    let [collections, memoCollections] = useMemoState<CollectionModel[]>(
        ["collections", page],
        []
    );

    onMount(() => {
        pathStore.set({ colllection: "/collection" });

        getCollections({ page, limit }).then(({ data }) => {
            collections = data.allCollections.map(CollectionModel.from);
        });
    });

    afterUpdate(() => {
        if (collections instanceof Array) {
            collections.forEach((collection) => {
                if (collection instanceof CollectionModel) {
                    collection.subscribe((state) => {
                        collections = collections.map((c) =>
                            c.id === state.id ? CollectionModel.from(state) : c
                        );
                    });
                }
            });
        }
    });

    onDestroy(() => {
        memoCollections(collections);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleDelete = async (collection: CollectionModel) => {
        const success = await collection.delete();
        if (success) {
            collections = collections.filter((c) => c.id !== collection.id);
        }
    };

    const handleConextMenu = (e: MouseEvent, collection: CollectionModel) => {
        collection.contextMenu(e);
    };
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each collections as collection}
            <CollectionCard
                title={collection.title}
                image={collection.image.url}
                prompt={collection.prompt}
                negativePrompt={collection.negativePrompt}
                onClickCopy={handleCopyText}
                onClickDelete={() => handleDelete(collection)}
                onContextMenu={(e) => handleConextMenu(e, collection)}
            />
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
</style>
