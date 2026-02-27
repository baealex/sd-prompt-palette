<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { toast } from "@baejino/ui";

    import { CollectionCard } from "~/components";

    import { collectionState } from "~/models/collection";
    import type { CollectionState } from "~/models/collection";

    import { useMemoState } from "~/modules/memo";

    import * as API from "~/api";

    export let id: number;

    let [collection, memoCollection] = useMemoState<CollectionState | null>(
        ["collection", id],
        null,
    );

    onMount(() => {
        if (!id) return;

        API.getCollection({ id }).then(({ data }) => {
            collection = collectionState(data.collection);
        });
    });

    onDestroy(() => {
        memoCollection(collection);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
    };

    const handleDelete = () => {
        collection?.delete();
    };

    const handleContextMenu = (e: MouseEvent) => {
        collection?.contextMenu(e);
    };
</script>

<div class="container">
    <div class="collection">
        {#if !$collection}
            <p>Loading...</p>
        {:else}
            <CollectionCard
                title={$collection.title}
                image={$collection.image}
                prompt={$collection.prompt}
                negativePrompt={$collection.negativePrompt}
                onClickCopy={handleCopyText}
                onClickDelete={handleDelete}
                onContextMenu={handleContextMenu}
            />
        {/if}
    </div>
</div>
