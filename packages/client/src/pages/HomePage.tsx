import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    type DragEndEvent,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { PageFrame } from '~/components/domain/PageFrame';
import { Button } from '~/components/ui/Button';
import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { Input } from '~/components/ui/Input';
import { Notice } from '~/components/ui/Notice';
import { PromptDialog } from '~/components/ui/PromptDialog';
import { useToast } from '~/components/ui/ToastProvider';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';
import {
    makeCategorySortableId,
    parseCategorySortableId,
    parseKeywordSortableId,
} from '~/features/home/dnd-ids';
import { SortableCategoryCard } from '~/features/home/SortableCategoryCard';
import type { HomeCategory } from '~/features/home/types';
import { useHomeBoard } from '~/features/home/use-home-board';
import { usePathStore } from '~/state/path-store';

interface KeywordRemoveTarget {
    categoryId: number;
    keywordId: number;
}

export const HomePage = () => {
    const { paths } = usePathStore();
    const navigate = useNavigate();
    const { pushToast } = useToast();
    const { copyToClipboard } = useClipboardToast();

    const [categoryName, setCategoryName] = useState('');
    const [pendingKeywordIdForImage, setPendingKeywordIdForImage] = useState<
        number | null
    >(null);
    const [renameCategoryTarget, setRenameCategoryTarget] =
        useState<HomeCategory | null>(null);
    const [removeCategoryTargetId, setRemoveCategoryTargetId] = useState<
        number | null
    >(null);
    const [removeKeywordTarget, setRemoveKeywordTarget] =
        useState<KeywordRemoveTarget | null>(null);
    const sampleImageInputRef = useRef<HTMLInputElement | null>(null);
    const lastErrorRef = useRef<string | null>(null);

    const {
        categories,
        loading,
        saving,
        error,
        reorderCategory,
        reorderKeyword,
        createCategoryByName,
        renameCategory,
        removeCategory,
        addKeywords,
        removeKeyword,
        addKeywordSampleImage,
        removeKeywordSampleImage,
    } = useHomeBoard();

    useEffect(() => {
        if (!error) {
            lastErrorRef.current = null;
            return;
        }
        if (lastErrorRef.current === error) {
            return;
        }
        pushToast({
            message: error,
            variant: 'error',
        });
        lastErrorRef.current = error;
    }, [error, pushToast]);

    const removeCategoryTarget = useMemo(
        () =>
            categories.find(
                (category) => category.id === removeCategoryTargetId,
            ) ?? null,
        [categories, removeCategoryTargetId],
    );

    const removeKeywordName = useMemo(() => {
        if (!removeKeywordTarget) {
            return null;
        }

        const targetCategory = categories.find(
            (category) => category.id === removeKeywordTarget.categoryId,
        );
        const targetKeyword = targetCategory?.keywords.find(
            (keyword) => keyword.id === removeKeywordTarget.keywordId,
        );
        return targetKeyword?.name ?? null;
    }, [categories, removeKeywordTarget]);

    const categorySensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleCategoryDragEnd = useCallback(
        (event: DragEndEvent) => {
            if (!event.over) {
                return;
            }

            const activeCategoryId = parseCategorySortableId(event.active.id);
            const overCategoryId = parseCategorySortableId(event.over.id);

            if (!activeCategoryId || !overCategoryId) {
                return;
            }

            void reorderCategory(activeCategoryId, overCategoryId);
        },
        [reorderCategory],
    );

    const handleKeywordDragEnd = useCallback(
        (categoryId: number, event: DragEndEvent) => {
            if (!event.over) {
                return;
            }

            const activeKeyword = parseKeywordSortableId(event.active.id);
            const overKeyword = parseKeywordSortableId(event.over.id);

            if (!activeKeyword || !overKeyword) {
                return;
            }

            if (
                activeKeyword.categoryId !== categoryId ||
                overKeyword.categoryId !== categoryId
            ) {
                return;
            }

            void reorderKeyword(
                categoryId,
                activeKeyword.keywordId,
                overKeyword.keywordId,
            );
        },
        [reorderKeyword],
    );

    const copyText = useCallback(
        async (text: string, feedbackLabel = 'Keyword') => {
            await copyToClipboard(text, { label: feedbackLabel });
        },
        [copyToClipboard],
    );

    const handleCreateCategory = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmedName = categoryName.trim();
            if (!trimmedName) {
                return;
            }

            const created = await createCategoryByName(trimmedName);
            if (created) {
                setCategoryName('');
                pushToast({
                    message: 'Category added',
                    variant: 'success',
                });
            }
        },
        [categoryName, createCategoryByName, pushToast],
    );

    const handleCopyAllKeywords = useCallback(
        (category: HomeCategory) => {
            const keywordText = category.keywords
                .map((keyword) => keyword.name)
                .join(', ');
            if (!keywordText) {
                return;
            }
            void copyText(keywordText, `${category.name} list`);
        },
        [copyText],
    );

    const handleRenameCategoryRequest = useCallback(
        (category: HomeCategory) => {
            setRenameCategoryTarget(category);
        },
        [],
    );

    const handleRenameCategoryConfirm = useCallback(
        (nextName: string) => {
            if (!renameCategoryTarget) {
                return;
            }

            void (async () => {
                const renamed = await renameCategory(
                    renameCategoryTarget.id,
                    nextName,
                );
                if (!renamed) {
                    return;
                }
                pushToast({
                    message: 'Category renamed',
                    variant: 'success',
                });
                setRenameCategoryTarget(null);
            })();
        },
        [pushToast, renameCategory, renameCategoryTarget],
    );

    const handleRemoveCategoryRequest = useCallback((categoryId: number) => {
        setRemoveCategoryTargetId(categoryId);
    }, []);

    const handleRemoveCategoryConfirm = useCallback(() => {
        if (!removeCategoryTargetId) {
            return;
        }

        void (async () => {
            const removed = await removeCategory(removeCategoryTargetId);
            if (!removed) {
                return;
            }
            pushToast({
                message: 'Category removed',
                variant: 'success',
            });
            setRemoveCategoryTargetId(null);
        })();
    }, [pushToast, removeCategory, removeCategoryTargetId]);

    const handleAddKeywords = useCallback(
        async (categoryId: number, rawKeywords: string) => {
            const added = await addKeywords(categoryId, rawKeywords);
            if (added) {
                pushToast({
                    message: 'Keyword added',
                    variant: 'success',
                });
            }
            return added;
        },
        [addKeywords, pushToast],
    );

    const handleCopyKeyword = useCallback(
        (keywordName: string) => {
            void copyText(keywordName);
        },
        [copyText],
    );

    const handleViewCollection = useCallback(
        (keywordName: string) => {
            void navigate({
                to: paths.collection,
                search: { query: keywordName },
            });
        },
        [navigate, paths.collection],
    );

    const handleRemoveKeywordRequest = useCallback(
        (categoryId: number, keywordId: number) => {
            setRemoveKeywordTarget({ categoryId, keywordId });
        },
        [],
    );

    const handleRemoveKeywordConfirm = useCallback(() => {
        if (!removeKeywordTarget) {
            return;
        }

        void (async () => {
            const removed = await removeKeyword(
                removeKeywordTarget.categoryId,
                removeKeywordTarget.keywordId,
            );
            if (!removed) {
                return;
            }
            pushToast({
                message: 'Keyword removed',
                variant: 'success',
            });
            setRemoveKeywordTarget(null);
        })();
    }, [pushToast, removeKeyword, removeKeywordTarget]);

    const handleAddKeywordSampleImageRequest = useCallback(
        (keywordId: number) => {
            setPendingKeywordIdForImage(keywordId);
            sampleImageInputRef.current?.click();
        },
        [],
    );

    const handleSampleImageChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const imageFile = event.target.files?.[0];
            if (!imageFile || !pendingKeywordIdForImage) {
                setPendingKeywordIdForImage(null);
                event.target.value = '';
                return;
            }

            void (async () => {
                const added = await addKeywordSampleImage(
                    pendingKeywordIdForImage,
                    imageFile,
                );
                if (added) {
                    pushToast({
                        message: 'Sample image added',
                        variant: 'success',
                    });
                }
            })();
            setPendingKeywordIdForImage(null);
            event.target.value = '';
        },
        [addKeywordSampleImage, pendingKeywordIdForImage, pushToast],
    );

    const handleRemoveKeywordSampleImage = useCallback(
        (keywordId: number) => {
            void (async () => {
                const removed = await removeKeywordSampleImage(keywordId);
                if (removed) {
                    pushToast({
                        message: 'Sample image removed',
                        variant: 'success',
                    });
                }
            })();
        },
        [pushToast, removeKeywordSampleImage],
    );

    return (
        <PageFrame
            title="Home"
            description="Manage categories and keywords with drag ordering and quick copy."
        >
            <form
                onSubmit={handleCreateCategory}
                className="mb-4 flex flex-wrap gap-2"
            >
                <Input
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    placeholder="Enter a category"
                    className="min-w-[240px] flex-1"
                    disabled={saving}
                />
                <Button type="submit" variant="primary" disabled={saving}>
                    Add Category
                </Button>
            </form>

            {loading ? (
                <Notice variant="neutral">Loading categories...</Notice>
            ) : null}

            {!loading && categories.length === 0 ? (
                <Notice variant="neutral" className="mb-4">
                    No categories yet. Add your first category to start
                    organizing prompts.
                </Notice>
            ) : null}

            <DndContext
                sensors={categorySensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
            >
                <SortableContext
                    items={categories.map((category) =>
                        makeCategorySortableId(category.id),
                    )}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <SortableCategoryCard
                                key={category.id}
                                category={category}
                                saving={saving}
                                onKeywordDragEnd={handleKeywordDragEnd}
                                onCopyAllKeywords={handleCopyAllKeywords}
                                onRenameCategory={handleRenameCategoryRequest}
                                onRemoveCategory={handleRemoveCategoryRequest}
                                onAddKeywords={handleAddKeywords}
                                onCopyKeyword={handleCopyKeyword}
                                onViewCollection={handleViewCollection}
                                onRemoveKeyword={handleRemoveKeywordRequest}
                                onAddKeywordSampleImage={
                                    handleAddKeywordSampleImageRequest
                                }
                                onRemoveKeywordSampleImage={
                                    handleRemoveKeywordSampleImage
                                }
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <input
                ref={sampleImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSampleImageChange}
            />

            <PromptDialog
                open={Boolean(renameCategoryTarget)}
                title="Rename category"
                description="Category names should be concise and searchable."
                defaultValue={renameCategoryTarget?.name ?? ''}
                placeholder="Enter category name"
                onSubmit={handleRenameCategoryConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        setRenameCategoryTarget(null);
                    }
                }}
            />

            <ConfirmDialog
                open={removeCategoryTargetId !== null}
                title="Delete category"
                description={
                    removeCategoryTarget
                        ? `"${removeCategoryTarget.name}" will be permanently removed.`
                        : 'This category will be removed.'
                }
                confirmLabel="Delete"
                danger
                onConfirm={handleRemoveCategoryConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        setRemoveCategoryTargetId(null);
                    }
                }}
            />

            <ConfirmDialog
                open={removeKeywordTarget !== null}
                title="Remove keyword"
                description={
                    removeKeywordName
                        ? `"${removeKeywordName}" will be removed from this category.`
                        : 'This keyword will be removed.'
                }
                confirmLabel="Remove"
                danger
                onConfirm={handleRemoveKeywordConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        setRemoveKeywordTarget(null);
                    }
                }}
            />
        </PageFrame>
    );
};
