<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import CollectionCard from "../components/CollectionCard.svelte";

    import { collectionModel } from "../models/collection";
    import type { CollectionModel } from "../models/collection";

    import { snackBar } from "../modules/ui/snack-bar";
    import { useMemoState } from "../modules/memo";

    import * as API from "../api";

    export let id;

    let [collection, memoCollection] = useMemoState<CollectionModel>(
        ["collection", id],
        null
    );

    onMount(() => {
        if (!id) return;

        API.getCollection({ id }).then(({ data }) => {
            collection = collectionModel(data.collection);
        });
    });

    onDestroy(() => {
        memoCollection(collection);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleDelete = () => {
        collection.delete();
    };

    const handleConextMenu = (e: MouseEvent) => {
        collection.contextMenu(e);
    };
</script>

<div class="container">
    <div class="collection">
        {#if collection == null}
            <p>Loading...</p>
        {:else}
            <CollectionCard
                title={$collection.title}
                image={$collection.image.url}
                prompt={$collection.prompt}
                negativePrompt={$collection.negativePrompt}
                onClickCopy={handleCopyText}
                onClickDelete={handleDelete}
                onContextMenu={handleConextMenu}
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
