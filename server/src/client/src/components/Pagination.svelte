<script lang="ts">
    import { getPageRange } from "../modules/page";

    export let currentPage = 1;
    export let totalPages = 1;
    export let visiblePages = 5;
    export let onPageChange: (page: number) => void;

    $: pageRange = getPageRange({
        currentPage,
        totalPages,
        visiblePages,
    });

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };
</script>

<div class="pagination">
    <li>
        <button
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
        >
            Prev
        </button>
    </li>

    {#each pageRange as page}
        <li>
            <button
                on:click={() => goToPage(page)}
                class:active={currentPage === page}
            >
                {page}
            </button>
        </li>
    {/each}

    <li>
        <button
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
        >
            Next
        </button>
    </li>
</div>

<style>
    .pagination {
        display: flex;
        list-style-type: none;
        padding: 0;
    }

    .pagination li {
        margin-right: 0.5rem;
    }

    .pagination li button {
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 0.25rem;
        border: none;
        background-color: #fff;
    }

    .pagination li button:hover {
        background-color: #888;
        color: #fff;
    }

    .pagination li button.active {
        background-color: #333;
        color: #fff;
    }
</style>
