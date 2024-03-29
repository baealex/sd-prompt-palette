<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { derived, get } from "svelte/store";
    import { Link } from "svelte-routing";

    import { Play, Pause } from "~/icons";

    import type { Collection } from "~/models/types";
    import { collectionState } from "~/models/collection";
    import type { CollectionState } from "~/models/collection";

    import { useMemoState } from "~/modules/memo";

    import { getCollections } from "~/api";

    let page = 1;
    const limit = 9999;
    let [collections, memoCollections] = useMemoState<CollectionState[]>(
        ["collections", page],
        [],
    );

    let slideShowRef: HTMLDivElement;

    let play = true;
    let index = 0;
    let randomCollections: Collection[] = [];

    $: resolveRandomCollections = derived(collections, () =>
        collections
            .map((collection) => ({
                ...collection,
                ...get(collection),
            }))
            .sort(() => Math.random() - 0.5),
    );

    const setRandomCollections = () => {
        randomCollections = [
            $resolveRandomCollections[index],
            $resolveRandomCollections[index + 1] ??
                $resolveRandomCollections[0],
        ];
        index += 1;
        if (index >= $resolveRandomCollections.length) {
            index = 0;
        }
        play = false;
        setTimeout(() => (play = true), 0);
    };

    onMount(() => {
        document.body.style.overflow = "hidden";

        getCollections({ page, limit }).then(({ data }) => {
            collections = data.allCollections.collections.map(collectionState);
        });

        slideShowRef.addEventListener(
            "animationend",
            setRandomCollections,
            false,
        );
    });

    onDestroy(() => {
        document.body.style.overflow = "auto";

        memoCollections(collections);

        slideShowRef.removeEventListener(
            "animationend",
            setRandomCollections,
            false,
        );
    });
</script>

<div
    bind:this={slideShowRef}
    data-index={index}
    class={`slide-show ${play && "transition"}`}
>
    {#if randomCollections.length === 0}
        <div class="item">
            <span>Generating a show for you...</span>
        </div>
    {/if}
    {#each randomCollections as randomCollection}
        <div class="item">
            <div
                class="background"
                style="background-image: url({randomCollection.image.url});"
            />
            <img
                class="image"
                src={randomCollection.image.url}
                alt={randomCollection.title}
            />
            <div class="title">
                <Link to={`/collection/${randomCollection.id}`}>
                    {randomCollection.title}
                </Link>
            </div>
        </div>
    {/each}
</div>
<button class="play" on:click={() => (play = !play)}>
    {#if play}
        <Pause />
    {:else}
        <Play />
    {/if}
</button>

<style lang="scss">
    @keyframes slide-show {
        90% {
            transform: translate(0, 0);
        }
        100% {
            transform: translate(0, -100%);
        }
    }

    .slide-show {
        position: relative;
        width: 100%;
        height: 100vh;
    }

    .transition {
        animation: slide-show 6s ease-out 1;
    }

    .item {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;

        .background {
            position: absolute;
            top: -10%;
            left: -10%;
            width: 120%;
            height: 120%;
            filter: blur(30px);
            background-size: cover;
            background-repeat: no-repeat;
        }

        .image {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            object-fit: contain;
        }

        .title {
            position: absolute;
            top: 40px;
            left: 40px;
            font-size: 1.2rem;
            text-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
            font-weight: bold;
            color: #eee;
        }
    }

    .play {
        position: fixed;
        bottom: 40px;
        right: 40px;
        z-index: 2;
        background: transparent;
        border: none;
        outline: none;
        opacity: 0.15;

        :global(svg) {
            width: 1.5rem;
            height: 1.5rem;
            color: #fff;
        }

        &:hover {
            opacity: 1;
            box-shadow: none;
        }
    }
</style>
