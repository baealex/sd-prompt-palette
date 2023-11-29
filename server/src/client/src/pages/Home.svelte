<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { prompt, toast } from "@baejino/ui";

    import type { Category } from "~/models/types";
    import type { Keyword } from "~/models/types";

    import { CategoryHeader, KeywordsList } from "~/components";

    import { ArrowUp, ArrowDown, Plus } from "~/icons";

    import { contextMenu } from "~/modules/ui/context-menu";
    import { useMemoState } from "~/modules/memo";
    import { imageToBase64 } from "~/modules/image";

    import * as API from "~/api";

    let inputRef: HTMLInputElement;
    let image: File;
    let pendingUploadImageKeywordId: number;

    let [categories, memoCategories] = useMemoState<Category[]>(
        "categories",
        [],
    );

    onMount(() => {
        API.getCategories().then(({ data }) => {
            categories = data.allCategories;
        });
    });

    onDestroy(() => {
        memoCategories(categories);
    });

    const handleClickCopyAll = (keywords: Keyword[]) => {
        navigator.clipboard.writeText(keywords.map((k) => k.name).join(", "));
        toast("Copied all keywords");
    };

    const handleClickKeyword = (keyword: Keyword) => {
        navigator.clipboard.writeText(keyword.name);
        toast("Copied keyword");
    };

    const handleContextMenuCategory = (e: MouseEvent, category: Category) => {
        contextMenu.create({
            top: e.clientY + window.scrollY,
            left: e.clientX + window.scrollX,
            menus: [
                {
                    label: "Rename",
                    click: async () => {
                        const title = await prompt(
                            "Enter new category name",
                            category.name,
                        );
                        if (!title) {
                            return;
                        }
                        await API.updateCategory({
                            id: category.id,
                            name: title,
                        });
                        categories = categories.map((c) => {
                            if (c.id === category.id) {
                                c.name = title;
                            }
                            return c;
                        });
                    },
                },
                {
                    label: "Delete",
                    click: async () => {
                        await API.deleteCategory({ id: category.id });
                        categories = categories
                            .filter((c) => c.id !== category.id)
                            .map((c) => ({ ...c, order: c.order - 1 }));
                    },
                },
            ],
        });
    };

    const handleContextMenuKeyword = (
        e: MouseEvent,
        keyword: Keyword,
        categoryId: number,
    ) => {
        contextMenu.create({
            top: e.clientY + window.scrollY,
            left: e.clientX + window.scrollX,
            menus: [
                {
                    label: "Delete",
                    click: async () => {
                        await API.deleteKeyword({
                            categoryId,
                            keywordId: keyword.id,
                        });
                        categories = categories.map((c) => {
                            if (c.id === categoryId) {
                                c.keywords = c.keywords.filter(
                                    (k) => k.id !== keyword.id,
                                );
                            }
                            return c;
                        });
                        toast("Removed keyword");
                    },
                },
                {
                    label: "View collection",
                    click: () => {},
                },
            ].concat(
                keyword.image
                    ? [
                          {
                              label: "Remove sample image",
                              click: async () => {
                                  await API.deleteSampleImage({
                                      id: keyword.id,
                                  });
                                  categories = categories.map((c) => {
                                      if (c.id === categoryId) {
                                          c.keywords = c.keywords.map((k) => {
                                              if (k.id === keyword.id) {
                                                  k.image = null;
                                              }
                                              return k;
                                          });
                                      }
                                      return c;
                                  });
                              },
                          },
                      ]
                    : [
                          {
                              label: "Add sample image",
                              click: async () => {
                                  pendingUploadImageKeywordId = keyword.id;
                                  inputRef.click();
                              },
                          },
                      ],
            ),
        });
    };

    const handleChangeImage = async (e: Event) => {
        image = (e.target as HTMLInputElement).files[0];

        if (!image) {
            pendingUploadImageKeywordId = undefined;
            return;
        }

        if (pendingUploadImageKeywordId) {
            const { data: imageData } = await API.imageUpload({
                image: await imageToBase64(image),
            });
            await API.createSampleImage({
                keywordId: pendingUploadImageKeywordId,
                imageId: imageData.id,
            });
            categories = categories.map((c) => {
                c.keywords = c.keywords.map((k) => {
                    if (k.id === pendingUploadImageKeywordId) {
                        return {
                            ...k,
                            image: {
                                id: imageData.id,
                                url: imageData.url,
                                width: imageData.width,
                                height: imageData.height,
                            },
                        };
                    }
                    return k;
                });
                return c;
            });
            pendingUploadImageKeywordId = undefined;
            toast("Added sample image");
        }
    };

    const handleSubmitCategory = async (e: Event) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        const name = formData.get("name") as string;

        if (!name) {
            toast("Please enter a category name");
            return;
        }

        const { data } = await API.createCategory({ name });

        categories = [
            {
                id: data.createCategory.id,
                name: data.createCategory.name,
                order: data.createCategory.order,
                keywords: [],
            },
            ...categories.map((c) => {
                c.order += 1;
                return c;
            }),
        ];
        toast("Added category");
        target.reset();
    };

    const handleSubmitKeyword = async (e: Event) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const categoryId = target.dataset.categoryId as string;
        const formData = new FormData(target);
        const keywords = formData.get("keyword") as string;

        if (!keywords) {
            toast("Please enter a keyword");
            return;
        }

        for (const keyword of keywords.split(",").map((k) => k.trim())) {
            if (!keyword) {
                continue;
            }

            const { data } = await API.createKeyword({
                categoryId: Number(categoryId),
                name: keyword,
            });

            categories = categories.map((c) => {
                if (Number(c.id) === Number(categoryId)) {
                    c.keywords.push({
                        id: data.createKeyword.id,
                        name: data.createKeyword.name,
                        categories: data.createKeyword.categories,
                    });
                }
                return c;
            });
        }
        toast("Added keywords");
        target.reset();
    };

    const handleClickChangeOrder = async (
        e: MouseEvent,
        category: Category,
        order: number,
    ) => {
        e.stopPropagation();
        await API.updateCategoryOrder({
            id: category.id,
            order,
        });
        const { data } = await API.getCategories();
        categories = data.allCategories;
    };

    const handleDragEndKeyword = async (
        category: Category,
        keyword: Keyword,
        dropPoint: number,
    ) => {
        await API.updateKeywordOrder({
            categoryId: category.id,
            keywordId: keyword.id,
            order: dropPoint,
        });
        const { data } = await API.getCategories();
        categories = data.allCategories;
    };
</script>

<div class="layout">
    <form class="category-form" on:submit={handleSubmitCategory}>
        <input name="name" type="text" placeholder="Enter a category" />
        <button class="primary-button">
            add
            <Plus />
        </button>
    </form>
    {#each categories as category}
        <div class="category">
            <div class="order">
                <button
                    disabled={category.order === 1}
                    on:click={(e) =>
                        handleClickChangeOrder(e, category, category.order - 1)}
                >
                    <ArrowUp />
                </button>
                <button
                    disabled={category.order === categories.length}
                    on:click={(e) =>
                        handleClickChangeOrder(e, category, category.order + 1)}
                >
                    <ArrowDown />
                </button>
            </div>
            <div class="content">
                <CategoryHeader
                    title={category.name}
                    onClickCopy={() => handleClickCopyAll(category.keywords)}
                    onContextMenu={(e) =>
                        handleContextMenuCategory(e, category)}
                />
                <KeywordsList
                    canDrag={true}
                    keywords={category.keywords}
                    onDragEnd={(keyword, dropPoint) => {
                        handleDragEndKeyword(category, keyword, dropPoint);
                    }}
                    onClick={handleClickKeyword}
                    onContextMenu={(e, keyword) =>
                        handleContextMenuKeyword(e, keyword, category.id)}
                />
                <form
                    class="keyword-form"
                    data-category-id={category.id}
                    on:submit={handleSubmitKeyword}
                >
                    <input
                        type="text"
                        name="keyword"
                        placeholder="Enter a keyword"
                    />
                    <button type="submit" class="primary-button">
                        add
                        <Plus />
                    </button>
                </form>
            </div>
        </div>
    {/each}
    <input
        bind:this={inputRef}
        type="file"
        accept="image/*"
        style="display: none;"
        on:change={handleChangeImage}
    />
</div>

<style lang="scss">
    .layout {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .category-form {
        margin: 1rem;
        display: flex;
        gap: 0.5rem;

        input {
            padding: 0.5rem 1rem;
            border-radius: 50px;
            border: none;
            outline: none;
            background-color: #fff;
            color: #000;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            font-weight: 500;

            &::placeholder {
                color: #aaa;
            }

            &:focus {
                box-shadow: 0;
            }
        }

        button :global(svg) {
            width: 0.8rem;
            height: 0.8rem;
        }
    }

    .category {
        padding: 2rem 2rem 2rem 1rem;
        display: flex;

        @media (max-width: 768px) {
            padding: 1rem;
        }
    }

    .category:not(:last-child) {
        border-bottom: 1px solid #aaa;
    }

    .order {
        margin-right: 1rem;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #aaa;
        padding-right: 1rem;
        gap: 0.5rem;

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #aaa;
            border-radius: 0.5rem;
            padding: 0.5rem;
            background-color: #fff;
            cursor: pointer;

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            :global(svg) {
                width: 1rem;
                height: 1rem;
                pointer-events: none;
            }

            &:hover {
                background-color: #eee;
            }
        }
    }

    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .keyword-form {
        margin-bottom: 1rem;
        display: flex;
        gap: 0.5rem;

        input {
            padding: 0.5rem 1rem;
            border-radius: 50px;
            border: none;
            outline: none;
            background-color: #fff;
            color: #000;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            font-weight: 500;

            &::placeholder {
                color: #aaa;
            }

            &:focus {
                box-shadow: 0;
            }
        }

        button :global(svg) {
            width: 0.8rem;
            height: 0.8rem;
        }
    }
</style>
