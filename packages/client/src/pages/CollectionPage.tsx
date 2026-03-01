import { CollectionFilterBar } from '~/components/domain/CollectionFilterBar';
import { CollectionNav } from '~/components/domain/CollectionNav';
import { CollectionRealtimeControl } from '~/components/domain/CollectionRealtimeControl';
import { CollectionSearchBar } from '~/components/domain/CollectionSearchBar';
import { CollectionShowcaseShortcut } from '~/components/domain/CollectionShowcaseShortcut';
import { PageFrame } from '~/components/domain/PageFrame';
import { Card } from '~/components/ui/Card';
import { useCollectionPageContent } from '~/features/collection/use-collection-page-content';
import { useCollectionPageData } from '~/features/collection/use-collection-page-data';
import { useCollectionPageFilters } from '~/features/collection/use-collection-page-filters';
import { useCollectionPagePaginationSync } from '~/features/collection/use-collection-page-pagination-sync';

const COLLECTION_PAGE_META = {
    title: 'Collection',
    description: 'Browse, search, and manage saved prompts.',
    searchPlaceholder: 'Search collections',
} as const;

export const CollectionPage = () => {
    const {
        searchState,
        draftQuery,
        draftModel,
        setDraftQuery,
        applySearch,
        handleSortChange,
        handleModelChange,
        handleSearchByChange,
        handleDateFieldChange,
        handleDateFromChange,
        handleDateToChange,
        handleDateRangeChange,
        handleDateQuickPreset,
        handleViewChange,
        handlePageChange,
        handleBrowseSelectedChange,
        resetFilters,
    } = useCollectionPageFilters();

    const {
        query,
        model,
        searchBy,
        dateField,
        dateFrom,
        dateTo,
        sort,
        view,
        page: currentPage,
        selected: selectedId,
    } = searchState;

    const {
        modelOptionsQuery,
        modelOptions,
        modelOptionsError,
        collectionsQuery,
        items,
        loading,
        totalPages,
        totalItems,
        queryErrorMessage,
        refreshCollections,
    } = useCollectionPageData({
        query,
        model,
        searchBy,
        dateField,
        dateFrom,
        dateTo,
        sort,
        currentPage,
    });

    useCollectionPagePaginationSync({
        currentPage,
        lastPage: collectionsQuery.data?.lastPage,
        onPageChange: handlePageChange,
    });

    const content = useCollectionPageContent({
        view,
        items,
        loading,
        currentPage,
        totalPages,
        totalItems,
        selectedId,
        queryErrorMessage,
        onPageChange: handlePageChange,
        onSelectedChange: handleBrowseSelectedChange,
        onRefresh: refreshCollections,
    });

    return (
        <PageFrame
            title={COLLECTION_PAGE_META.title}
            description={COLLECTION_PAGE_META.description}
        >
            <Card
                as="section"
                padding="none"
                emphasis="brandGlow"
                className="mb-4 overflow-hidden"
            >
                <CollectionSearchBar
                    value={draftQuery}
                    searchBy={searchBy}
                    onChange={setDraftQuery}
                    onSearchByChange={handleSearchByChange}
                    onSubmit={applySearch}
                    placeholder={COLLECTION_PAGE_META.searchPlaceholder}
                    embedded
                />
                <CollectionFilterBar
                    sort={sort}
                    model={draftModel}
                    dateField={dateField}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    modelOptions={modelOptions}
                    loadingModelOptions={modelOptionsQuery.isPending}
                    modelOptionsError={modelOptionsError}
                    onSortChange={handleSortChange}
                    onModelChange={handleModelChange}
                    onDateFieldChange={handleDateFieldChange}
                    onDateFromChange={handleDateFromChange}
                    onDateToChange={handleDateToChange}
                    onDateRangeChange={handleDateRangeChange}
                    onDateQuickPreset={handleDateQuickPreset}
                    onReset={resetFilters}
                    embedded
                />
            </Card>
            <div className="mb-4">
                <CollectionRealtimeControl />
            </div>
            <Card as="section" padding="sm" className="mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CollectionNav view={view} onViewChange={handleViewChange} />
                    <CollectionShowcaseShortcut />
                </div>
            </Card>

            {content}
        </PageFrame>
    );
};
