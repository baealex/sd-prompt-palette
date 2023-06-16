<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import type { Category, Keyword } from "../models/types";
    import { useMemoState } from "../modules/memo";
    import { getCategories } from "../api";
    import Data from "../icons/Data.svelte";
    import KeywordsList from "../components/KeywordsList.svelte";
    import CategoryHeader from "../components/CategoryHeader.svelte";
    import { snackBar } from "../modules/ui/snack-bar";

    let [categories, memoCategories] = useMemoState<Category[]>(
        ["categories"],
        []
    );

    let [keywords, memoKeywords] = useMemoState<Keyword[]>(
        ["generated", "keywords"],
        []
    );

    onMount(() => {
        getCategories().then(({ data }) => {
            categories = data.allCategories;
        });
    });

    onDestroy(() => {
        memoKeywords(keywords);
        memoCategories(categories);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        snackBar("Copied to clipboard");
    };

    const handleSubmitGenerate = (e: Event) => {
        e.preventDefault();

        const selected = Array.from(
            (e.target as HTMLFormElement).querySelectorAll("input")
        )
            .filter((el) => el.checked)
            .map((el) => el.name);

        keywords = categories
            .filter((category) => selected.includes(category.name))
            .map((category) => {
                const randomIndex = Math.floor(
                    Math.random() * category.keywords.length
                );
                return category.keywords[randomIndex];
            });
    };
</script>

<div class="container">
    <form on:submit={handleSubmitGenerate}>
        {#each categories as category}
            <label class="checkbox-wrapper">
                <input type="checkbox" name={category.name} />
                <div class="checkbox" />
                {category.name}
            </label>
        {/each}
        <button class="primary-button">
            <Data />
            Generate
        </button>
    </form>
    {#if keywords.length > 0}
        <div>
            <CategoryHeader
                title="Generated"
                onClickCopy={() => {
                    handleCopyText(
                        keywords.map((keyword) => keyword.name).join(", ")
                    );
                }}
            />
            <KeywordsList
                {keywords}
                onClick={(keyword) => handleCopyText(keyword.name)}
            />
        </div>
    {/if}
</div>

<style lang="scss">
    .container {
        padding: 2rem;
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 2rem;

        @media (max-width: 1024px) {
            padding: 1rem;
            grid-template-columns: 1fr 2fr;
        }

        @media (max-width: 768px) {
            padding: 1rem;
            grid-template-columns: 1fr;
        }
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
    }

    .checkbox-wrapper {
        font-size: 1rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #333;

        input {
            display: none;
        }

        .checkbox {
            width: 1rem;
            height: 1rem;
            border: 1px solid #ccc;
            border-radius: 0.25rem;
            background-color: #fff;
        }

        input:checked + .checkbox {
            background-color: #333;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M9.172 16.172a.5.5 0 0 1-.707 0L4.5 12.207l1.414-1.414L9.172 13.58l7.88-7.88 1.414 1.414z'/%3E%3C/svg%3E");
        }
    }
</style>
