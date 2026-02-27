<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { toast } from "@baejino/ui";

    import type { Category, Keyword } from "~/models/types";

    import { KeywordsList, CategoryHeader, Checkbox } from "~/components";

    import { Data } from "~/icons";

    import { useMemoState } from "~/modules/memo";

    import { getCategories } from "~/api";

    let [categories, memoCategories] = useMemoState<Category[]>(
        ["categories"],
        []
    );

    let [keywords, memoKeywords] = useMemoState<Keyword[]>(
        ["generated", "keywords"],
        []
    );

    let [selected, memoSelected] = useMemoState<string[]>(
        ["selected"],
        categories.map((category) => category.name)
    );

    onMount(() => {
        getCategories().then(({ data }) => {
            categories = data.allCategories;
        });
    });

    onDestroy(() => {
        memoKeywords(keywords);
        memoSelected(selected);
        memoCategories(categories);
    });

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard");
    };

    const handleChangeCheckbox = (e: Event) => {
        const checkbox = e.target as HTMLInputElement;
        const name = checkbox.name;

        if (checkbox.checked) {
            selected = [...selected, name];
        } else {
            selected = selected.filter((el) => el !== name);
        }
    };

    const handleSubmitGenerate = (e: Event) => {
        e.preventDefault();

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

<div class="container grid">
    <form on:submit={handleSubmitGenerate}>
        {#each categories as category}
            <Checkbox
                name={category.name}
                label={category.name}
                checked={selected.includes(category.name)}
                onChange={handleChangeCheckbox}
            />
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
    .grid {
        display: grid;
        grid-template-columns: 1fr 3fr;
        gap: 2rem;

        @media (max-width: 1024px) {
            grid-template-columns: 1fr 2fr;
        }

        @media (max-width: 768px) {
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
</style>
