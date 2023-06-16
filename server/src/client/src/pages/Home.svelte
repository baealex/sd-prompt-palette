<script lang="ts">
    import type { Category } from "../models/types";

    import CategoryHeader from "../components/CategoryHeader.svelte";
    import KeywordsList from "../components/KeywordsList.svelte";
    import ArrowUp from "../icons/ArrowUp.svelte";
    import ArrowDown from "../icons/ArrowDown.svelte";

    import {
        createCategory,
        createKeyword,
        createSampleImage,
        deleteCategory,
        deleteKeyword,
        deleteSampleImage,
        getCategories,
        imageUpload,
        updateCategory,
        updateCategoryOrder,
        updateKeywordOrder,
    } from "../api";
    import type { Keyword } from "../models/types";
    import { snackBar } from "../modules/snack-bar";
    import { contextMenu } from "../modules/context-menu";
    import { useMemo } from "../modules/memo";
    import Plus from "../icons/Plus.svelte";
    import { imageToBase64 } from "../modules/image";

    let inputRef: HTMLInputElement;
    let image: File;
    let pendingUploadImageKeywordId: number;

    const categoires = useMemo<Category[]>({
        key: "categories",
        defaultValue: [],
    });

    getCategories().then(({ data }) => {
        categoires.value = data.allCategories;
    });

    const handleClickCopyAll = (keywords: Keyword[]) => {
        navigator.clipboard.writeText(keywords.map((k) => k.name).join(", "));
        snackBar("Copied all keywords");
    };

    const handleClickKeyword = (keyword: Keyword) => {
        navigator.clipboard.writeText(keyword.name);
        snackBar("Copied keyword");
    };

    const handleContextMenuCategory = (e: MouseEvent, category: Category) => {
        contextMenu.create({
            top: e.clientY,
            left: e.clientX,
            menus: [
                {
                    label: "Rename",
                    click: async () => {
                        const title = prompt(
                            "Enter new category name",
                            category.name
                        );
                        await updateCategory({
                            id: category.id,
                            name: title,
                        });
                        categoires.value = categoires.value.map((c) => {
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
                        await deleteCategory({ id: category.id });
                        categoires.value = categoires.value
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
        categoryId: number
    ) => {
        contextMenu.create({
            top: e.clientY,
            left: e.clientX,
            menus: [
                {
                    label: "Delete",
                    click: async () => {
                        await deleteKeyword({
                            categoryId,
                            keywordId: keyword.id,
                        });
                        categoires.value = categoires.value.map((c) => {
                            if (c.id === categoryId) {
                                c.keywords = c.keywords.filter(
                                    (k) => k.id !== keyword.id
                                );
                            }
                            return c;
                        });
                        snackBar("Removed keyword");
                    },
                },
            ].concat(
                keyword.image
                    ? [
                          {
                              label: "Remove sample image",
                              click: async () => {
                                  await deleteSampleImage({
                                      id: keyword.id,
                                  });
                                  categoires.value = categoires.value.map(
                                      (c) => {
                                          if (c.id === categoryId) {
                                              c.keywords = c.keywords.map(
                                                  (k) => {
                                                      if (k.id === keyword.id) {
                                                          k.image = null;
                                                      }
                                                      return k;
                                                  }
                                              );
                                          }
                                          return c;
                                      }
                                  );
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
                      ]
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
            const { data: imageData } = await imageUpload({
                image: await imageToBase64(image),
            });
            await createSampleImage({
                keywordId: pendingUploadImageKeywordId,
                imageId: imageData.id,
            });
            categoires.value = categoires.value.map((c) => {
                c.keywords = c.keywords.map((k) => {
                    if (k.id === pendingUploadImageKeywordId) {
                        return {
                            ...k,
                            image: {
                                id: imageData.id,
                                url: imageData.url,
                            },
                        };
                    }
                    return k;
                });
                return c;
            });
            pendingUploadImageKeywordId = undefined;
            snackBar("Added sample image");
        }
    };

    const handleSubmitCategory = async (e: Event) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        const name = formData.get("name") as string;

        if (!name) {
            snackBar("Please enter a category name");
            return;
        }

        const { data } = await createCategory({ name });

        categoires.value = [
            {
                id: data.createCategory.id,
                name: data.createCategory.name,
                order: data.createCategory.order,
                keywords: [],
            },
            ...categoires.value.map((c) => {
                c.order += 1;
                return c;
            }),
        ];
        snackBar("Added category");
        target.reset();
    };

    const handleSubmitKeyword = async (e: Event) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const categoryId = target.dataset.categoryId as string;
        const formData = new FormData(target);
        const keywords = formData.get("keyword") as string;

        if (!keywords) {
            snackBar("Please enter a keyword");
            return;
        }

        for (const keyword of keywords.split(",").map((k) => k.trim())) {
            if (!keyword) {
                continue;
            }

            const { data } = await createKeyword({
                categoryId: Number(categoryId),
                name: keyword,
            });

            categoires.value = categoires.value.map((c) => {
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
        snackBar("Added keywords");
        target.reset();
    };

    const handleClickChangeOrder = async (
        e: MouseEvent,
        category: Category,
        order: number
    ) => {
        e.stopPropagation();
        await updateCategoryOrder({
            id: category.id,
            order,
        });
        const { data } = await getCategories();
        categoires.value = data.allCategories;
    };

    const handleDragEndKeyword = async (
        category: Category,
        keyword: Keyword,
        dropPoint: number
    ) => {
        await updateKeywordOrder({
            categoryId: category.id,
            keywordId: keyword.id,
            order: dropPoint,
        });
        const { data } = await getCategories();
        categoires.value = data.allCategories;
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
    {#each categoires.value as category}
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
                    disabled={category.order === categoires.value.length}
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

        button svg {
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

        button svg {
            width: 0.8rem;
            height: 0.8rem;
        }
    }
</style>
