<script lang="ts">
    import { Link } from "svelte-routing";
</script>

<div class="collection-nav">
    <Link to="/collection">List</Link>
    <Link to="/collection/galley">Grid</Link>
</div>

<style lang="scss">
    .collection-nav {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 1.5rem;

        :global(a) {
            text-decoration: none;
            color: #000;
            font-weight: 600;
            font-size: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid #aaa;
            transition: all 0.2s ease-in-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            &:hover:not([aria-current="page"]) {
                background-color: #aaa;
                color: #fff;
            }
        }

        :global([aria-current="page"]) {
            background-color: #000;
            color: #fff;
        }
    }
</style>
