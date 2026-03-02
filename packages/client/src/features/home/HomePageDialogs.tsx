import { ConfirmDialog } from '~/components/ui/ConfirmDialog';
import { PromptDialog } from '~/components/ui/PromptDialog';
import type { HomeCategory } from '~/features/home/types';

interface KeywordRemoveTarget {
    categoryId: number;
    keywordId: number;
}

interface HomePageDialogsProps {
    renameCategoryTarget: HomeCategory | null;
    removeCategoryTargetId: number | null;
    removeCategoryTarget: HomeCategory | null;
    removeKeywordTarget: KeywordRemoveTarget | null;
    removeKeywordName: string | null;
    onRenameCategoryConfirm: (nextName: string) => void;
    onCloseRenameDialog: () => void;
    onRemoveCategoryConfirm: () => void;
    onCloseRemoveCategoryDialog: () => void;
    onRemoveKeywordConfirm: () => void;
    onCloseRemoveKeywordDialog: () => void;
}

export const HomePageDialogs = ({
    renameCategoryTarget,
    removeCategoryTargetId,
    removeCategoryTarget,
    removeKeywordTarget,
    removeKeywordName,
    onRenameCategoryConfirm,
    onCloseRenameDialog,
    onRemoveCategoryConfirm,
    onCloseRemoveCategoryDialog,
    onRemoveKeywordConfirm,
    onCloseRemoveKeywordDialog,
}: HomePageDialogsProps) => {
    return (
        <>
            <PromptDialog
                open={Boolean(renameCategoryTarget)}
                title="Rename category"
                description="Category names should be concise and searchable."
                defaultValue={renameCategoryTarget?.name ?? ''}
                placeholder="Enter category name"
                onSubmit={onRenameCategoryConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        onCloseRenameDialog();
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
                onConfirm={onRemoveCategoryConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        onCloseRemoveCategoryDialog();
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
                onConfirm={onRemoveKeywordConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        onCloseRemoveKeywordDialog();
                    }
                }}
            />
        </>
    );
};
