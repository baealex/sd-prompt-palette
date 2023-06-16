<script lang="ts">
    import type { Keyword } from "../models/types";

    export let keywords: Keyword[] = [];
    export let onClick: (keyword: Keyword) => void;
    export let onContextMenu: (e: MouseEvent, keyword: Keyword) => void = null;
</script>

<ul class="prompt-list">
    {#each keywords as keyword}
        <li
            class="prompt"
            on:click={() => onClick(keyword)}
            on:contextmenu={(e) => onContextMenu(e, keyword)}
        >
            {keyword.name}
        </li>
    {/each}
</ul>

<style lang="scss">
    .prompt-list {
        position: relative;
        margin: 0;
        padding: 0;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

    .prompt {
        position: relative;
        list-style: none;
        background-color: #fff;
        padding: 0.5rem 0.8rem;
        border-radius: 0.5rem;
        cursor: pointer;

        .dragHandle {
            svg {
                width: 0.8rem;
                height: 0.8rem;
            }
        }

        img {
            display: none;
            position: absolute;
            background: #fff;
            border-radius: 0.5rem;
            bottom: 0;
            right: 0;
            width: 100px;
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
