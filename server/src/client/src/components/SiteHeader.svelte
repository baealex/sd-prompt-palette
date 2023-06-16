<script lang="ts">
    import { Link } from "svelte-routing";
    import pathStore from "../store/path";
    import { onMount } from "svelte";

    let collectionPath = pathStore.state.colllection;

    onMount(() => {
        pathStore.subscribe((state) => {
            collectionPath = state.colllection;
        });
    });
</script>

<nav class="header">
    <h1>Prompt Palette</h1>
    <div class="links">
        <Link to="/">Home</Link>
        <Link to={collectionPath}>Collection</Link>
        <Link to="/image-load">PNG Info</Link>
    </div>
</nav>

<style lang="scss">
    .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 1rem;
        background-color: #fff;
        border-bottom: 1px solid #eaeaea;
        height: 80px;
        position: relative;

        h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
        }
    }

    .links {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        user-select: none;
        color: #aaa;

        :global([aria-current="page"]) {
            color: #333;
        }
    }
</style>
