<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { derived, get } from "svelte/store";

    import { collectionModel } from "../models/collection";
    import type { CollectionModel } from "../models/collection";

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

    $: resolveCollections = derived(collections, () =>
        collections.map((collection) => ({
            ...collection,
            ...get(collection),
        }))
    );

    onMount(() => {
        pathStore.set({ colllection: "/collection" });

        getCollections({ page, limit }).then(({ data }) => {
            collections = data.allCollections.map(collectionModel);
        });
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
            collections = collections.filter(
                (c) => get(c).id !== get(collection).id
            );
        }
    };

    const handleConextMenu = (e: MouseEvent, collection: CollectionModel) => {
        collection.contextMenu(e);
    };
</script>

<div class="container">
    <CollectionNav />
    <div class="collection">
        {#each $resolveCollections as collection}
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
