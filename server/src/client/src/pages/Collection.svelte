<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import type { Collection } from "../models/types";

    import CollectionNav from "../components/CollectionNav.svelte";
    import CollectionCard from "../components/CollectionCard.svelte";

    import { useMemoState } from "../modules/memo";
    import { snackBar } from "../modules/ui/snack-bar";

    import { deleteCollection, getCollections } from "../api";

    import pathStore from "../store/path";

    let page = 1;
    const limit = 9999;
    let [collections, memoCollections] = useMemoState<Collection[]>(
        ["collections", page],
        []
    );

    onMount(() => {
        pathStore.set({ colllection: "/collection" });

        getCollections({ page, limit }).then(({ data }) => {
            collections = data.allCollections;
        });
    });

    onDestroy(() => {
        memoCollections(collections);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this collection?")) {
            await deleteCollection({ id });
            collections = collections.filter((c) => c.id !== id);
            snackBar("Deleted collection");
        }
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
                onClickDelete={() => handleDelete(collection.id)}
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
