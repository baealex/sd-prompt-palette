<script lang="ts">
    import { Draft } from "~/icons";

    export let title: string;
    export let onClickCopy: () => void;
    export let onContextMenu: ((e: MouseEvent) => void) | null = null;
</script>

<div class="category-header">
    <h2 on:contextmenu={onContextMenu}>
        {title}
    </h2>
    <div>
        <button class="secondary-button" on:click={() => onClickCopy()}>
            <Draft />
            copy all
        </button>
    </div>
</div>

<style lang="scss">
    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        h2 {
            margin: 0;
            padding: 0;
        }
    }
</style>
