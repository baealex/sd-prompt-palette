<script lang="ts">
    import type { Collection } from "../models/types";
    import { snackBar } from "../modules/ui/snack-bar";
    import { useMemoState } from "../modules/memo";

    import { deleteCollection, getCollection } from "../api";
    import CollectionCard from "../components/CollectionCard.svelte";
    import { onDestroy, onMount } from "svelte";

    export let id;

    let [collection, memoCollection] = useMemoState<Collection>(
        ["collection", id],
        null
    );

    onMount(() => {
        if (!id || collection) return;

        getCollection({ id }).then(({ data }) => {
            collection = data.collection;
        });
    });

    onDestroy(() => {
        memoCollection(collection);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this collection?")) {
            await deleteCollection({ id });
        }
    };
</script>

<div class="container">
    <div class="collection">
        {#if collection == null}
            <p>Loading...</p>
        {:else}
            <CollectionCard
                title={collection.title}
                image={collection.image.url}
                prompt={collection.prompt}
                negativePrompt={collection.negativePrompt}
                onClickCopy={handleCopyText}
                onClickDelete={() => handleDelete(collection.id)}
            />
        {/if}
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
