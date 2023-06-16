<script lang="ts">
    import type { Keyword } from "../models/types";

    let dragging = false;
    let dropPoint = 0;

    export let keywords: Keyword[] = [];
    export let canDrag = false;
    export let onDragEnd: (keyword: Keyword, dropPoint: number) => void = null;
    export let onClick: (keyword: Keyword) => void;
    export let onContextMenu: (e: MouseEvent, keyword: Keyword) => void = null;

    const handleDragStart = () => {
        dropPoint = 0;
        dragging = true;
    };

    const handleDragEnd = (keyword: Keyword, dropPoint: number) => {
        dragging = false;
        if (dropPoint === 0) return;
        onDragEnd?.(keyword, dropPoint);
    };
</script>

<ul class="keyword-list">
    {#each keywords as keyword, index}
        {#if canDrag && dragging}
            <span
                class={`dragPoint ${dropPoint === index + 1 ? "active" : ""}`}
                on:dragenter={() => {
                    dropPoint = index + 1;
                }}
                on:dragleave={() => {
                    dropPoint = 0;
                }}
                on:dragover={(e) => {
                    e.preventDefault();
                }}
            />
        {/if}
        <li
            class="keyword"
            on:keydown={(e) => {
                if (e.key === "Enter") {
                    onClick(keyword);
                }
            }}
            draggable={canDrag}
            on:dragstart={handleDragStart}
            on:dragend={() => handleDragEnd(keyword, dropPoint)}
            on:click={() => onClick(keyword)}
            on:contextmenu={(e) => onContextMenu(e, keyword)}
        >
            {keyword.name}
            {#if keyword.image}
                <img
                    loading="lazy"
                    src={keyword.image.url}
                    alt={keyword.name}
                />
            {/if}
        </li>
    {/each}
</ul>

<style lang="scss">
    .keyword-list {
        position: relative;
        margin: 0;
        padding: 0;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    .dragPoint {
        top: 0;
        left: 0;
        width: 0.5rem;
        height: 40px;
        background: #fff;
        border-radius: 0.5rem;
        z-index: 2;

        &.active {
            background: #f00;
        }
    }

    .keyword {
        position: relative;
        list-style: none;
        background-color: #fff;
        padding: 0.5rem 0.8rem;
        border-radius: 0.5rem;
        cursor: pointer;

        img {
            display: none;
            position: absolute;
            background: #fff;
            border-radius: 0.5rem;
            bottom: 0;
            right: 0;
            width: 120px;
            height: auto;
            transform: translate(100%, 100%);
            z-index: 1;
        }

        &:hover {
            img {
                display: block;
            }
        }
    }
</style>
