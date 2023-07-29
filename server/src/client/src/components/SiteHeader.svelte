<script lang="ts">
    import { onMount } from "svelte";
    import { Link } from "svelte-routing";

    import { Menu, Cross } from "~/icons";

    import pathStore from "~/store/path";

    let collectionPath = pathStore.state.colllection;
    let menuOpen = false;

    onMount(() => {
        pathStore.subscribe((state) => {
            collectionPath = state.colllection;
        });
    });
</script>

<nav class="header">
    <Link to="/">
        <h1>Prompt Palette</h1>
    </Link>
    <button class="menu" on:click={() => (menuOpen = !menuOpen)}>
        {#if menuOpen}
            <Cross />
        {:else}
            <Menu />
        {/if}
    </button>
    <div class="links {menuOpen ? 'open' : ''}">
        <Link to="/">Home</Link>
        <Link to="/idea">Idea</Link>
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

        @media (max-width: 768px) {
            display: none;

            &.open {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                background-color: #fff;
                width: 100%;
                gap: 1.5rem;
                padding: 2rem 1rem;
                position: absolute;
                top: 80px;
                left: 0;
                z-index: 1;
            }
        }
    }

    .menu {
        display: none;
        background-color: transparent;
        border: none;
        outline: none;
        padding: 0;
        margin: 0;
        color: #000;
        font-size: 1.5rem;

        &:hover {
            box-shadow: none;
        }

        :global(svg) {
            width: 1.5rem;
            height: 1.5rem;
        }

        @media (max-width: 768px) {
            display: flex;
        }
    }
</style>
