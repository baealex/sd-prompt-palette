import { PageFrame } from '~/components/domain/PageFrame';
import { Notice } from '~/components/ui/Notice';
import { HomeCategoryBoard } from '~/features/home/HomeCategoryBoard';
import { HomeCategoryCreateForm } from '~/features/home/HomeCategoryCreateForm';
import { HomePageDialogs } from '~/features/home/HomePageDialogs';
import { useHomePageController } from '~/features/home/use-home-page-controller';

export const HomePage = () => {
    const {
        categoryName,
        categories,
        loading,
        saving,
        sampleImageInputRef,
        renameCategoryTarget,
        removeCategoryTargetId,
        removeCategoryTarget,
        removeKeywordTarget,
        removeKeywordName,
        setCategoryName,
        setRenameCategoryTarget,
        setRemoveCategoryTargetId,
        setRemoveKeywordTarget,
        handleCreateCategory,
        handleKeywordDragEnd,
        handleCopyAllKeywords,
        handleRenameCategoryRequest,
        handleRenameCategoryConfirm,
        handleRemoveCategoryRequest,
        handleRemoveCategoryConfirm,
        handleAddKeywords,
        handleCopyKeyword,
        handleViewCollection,
        handleRemoveKeywordRequest,
        handleRemoveKeywordConfirm,
        handleAddKeywordSampleImageRequest,
        handleSampleImageChange,
        handleRemoveKeywordSampleImage,
        reorderCategory,
    } = useHomePageController();

    return (
        <PageFrame
            title="Home"
            description="Manage categories and keywords with drag ordering and quick copy."
        >
            <HomeCategoryCreateForm
                value={categoryName}
                saving={saving}
                onValueChange={setCategoryName}
                onSubmit={handleCreateCategory}
            />

            {loading ? (
                <Notice variant="neutral">Loading categories...</Notice>
            ) : null}

            {!loading && categories.length === 0 ? (
                <Notice variant="neutral" className="mb-4">
                    No categories yet. Add your first category to start
                    organizing prompts.
                </Notice>
            ) : null}

            <HomeCategoryBoard
                categories={categories}
                saving={saving}
                onReorderCategory={(activeCategoryId, overCategoryId) => {
                    void reorderCategory(activeCategoryId, overCategoryId);
                }}
                onKeywordDragEnd={handleKeywordDragEnd}
                onCopyAllKeywords={handleCopyAllKeywords}
                onRenameCategory={handleRenameCategoryRequest}
                onRemoveCategory={handleRemoveCategoryRequest}
                onAddKeywords={handleAddKeywords}
                onCopyKeyword={handleCopyKeyword}
                onViewCollection={handleViewCollection}
                onRemoveKeyword={handleRemoveKeywordRequest}
                onAddKeywordSampleImage={handleAddKeywordSampleImageRequest}
                onRemoveKeywordSampleImage={handleRemoveKeywordSampleImage}
            />

            <input
                ref={sampleImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSampleImageChange}
            />

            <HomePageDialogs
                renameCategoryTarget={renameCategoryTarget}
                removeCategoryTargetId={removeCategoryTargetId}
                removeCategoryTarget={removeCategoryTarget}
                removeKeywordTarget={removeKeywordTarget}
                removeKeywordName={removeKeywordName}
                onRenameCategoryConfirm={handleRenameCategoryConfirm}
                onCloseRenameDialog={() => {
                    setRenameCategoryTarget(null);
                }}
                onRemoveCategoryConfirm={handleRemoveCategoryConfirm}
                onCloseRemoveCategoryDialog={() => {
                    setRemoveCategoryTargetId(null);
                }}
                onRemoveKeywordConfirm={handleRemoveKeywordConfirm}
                onCloseRemoveKeywordDialog={() => {
                    setRemoveKeywordTarget(null);
                }}
            />
        </PageFrame>
    );
};
