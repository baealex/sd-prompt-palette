import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { getCategories } from '~/api';
import { CategoryHeader } from '~/components/domain/CategoryHeader';
import { Checkbox } from '~/components/domain/Checkbox';
import { KeywordsList } from '~/components/domain/KeywordsList';
import { PageFrame } from '~/components/domain/PageFrame';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Notice } from '~/components/ui/Notice';
import { useClipboardToast } from '~/components/ui/use-clipboard-toast';
import type { Category, Keyword } from '~/models/types';
import { useMemoState } from '~/modules/memo';

export const IdeaPage = () => {
    const { copyToClipboard } = useClipboardToast();
    const [categories, setMemoCategories] = useMemoState<Category[]>(['categories'], []);
    const [generatedKeywords, setMemoKeywords] = useMemoState<Keyword[]>(['generated', 'keywords'], []);
    const [selected, setMemoSelected] = useMemoState<string[]>(['selected'], categories.map((category) => category.name));

    const [categoryList, setCategoryList] = useState<Category[]>(categories);
    const [keywords, setKeywords] = useState<Keyword[]>(generatedKeywords);
    const [selectedNames, setSelectedNames] = useState<string[]>(selected);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(categoryList.length === 0);
    const [categoryQuery, setCategoryQuery] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await getCategories();
                if (cancelled) {
                    return;
                }

                const nextCategories = response.data.allCategories;
                setCategoryList(nextCategories);
                setSelectedNames((prev) => {
                    if (prev.length === 0) {
                        return nextCategories.map((category) => category.name);
                    }

                    const validSelection = prev.filter((name) => (
                        nextCategories.some((category) => category.name === name)
                    ));

                    return validSelection.length > 0
                        ? validSelection
                        : nextCategories.map((category) => category.name);
                });
            } catch (nextError) {
                if (cancelled) {
                    return;
                }
                setError(nextError instanceof Error ? nextError.message : 'Failed to load categories');
            } finally {
                if (!cancelled) {
                    setIsLoadingCategories(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setMemoKeywords(keywords);
        setMemoSelected(selectedNames);
        setMemoCategories(categoryList);
    }, [categoryList, keywords, selectedNames, setMemoCategories, setMemoKeywords, setMemoSelected]);

    const selectedNameSet = useMemo(() => new Set(selectedNames), [selectedNames]);

    const normalizedCategoryQuery = categoryQuery.trim().toLowerCase();

    const visibleCategories = useMemo(() => {
        if (normalizedCategoryQuery.length === 0) {
            return categoryList;
        }

        return categoryList.filter((category) => (
            category.name.toLowerCase().includes(normalizedCategoryQuery)
        ));
    }, [categoryList, normalizedCategoryQuery]);

    const selectedCount = useMemo(() => {
        return categoryList.reduce((count, category) => (
            selectedNameSet.has(category.name) ? count + 1 : count
        ), 0);
    }, [categoryList, selectedNameSet]);

    const isAllSelected = categoryList.length > 0 && selectedCount === categoryList.length;
    const canGenerate = selectedCount > 0 && categoryList.length > 0 && !isLoadingCategories;

    const handleCheckboxChange = (nextChecked: boolean, name: string) => {
        setSelectedNames((prev) => {
            if (nextChecked) {
                if (prev.includes(name)) {
                    return prev;
                }
                return [...prev, name];
            }

            return prev.filter((value) => value !== name);
        });
    };

    const handleSelectAll = () => {
        setSelectedNames(categoryList.map((category) => category.name));
    };

    const handleClearSelection = () => {
        setSelectedNames([]);
    };

    const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canGenerate) {
            return;
        }

        const nextKeywords = categoryList
            .filter((category) => selectedNameSet.has(category.name))
            .map((category) => {
                if (category.keywords.length === 0) {
                    return null;
                }

                const randomIndex = Math.floor(Math.random() * category.keywords.length);
                return category.keywords[randomIndex];
            })
            .filter((keyword): keyword is Keyword => keyword !== null);

        setKeywords(nextKeywords);
    };

    return (
        <PageFrame
            title="Idea"
            description="Choose categories and generate one random keyword from each selection."
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
                <Card className="h-full">
                    <form onSubmit={handleGenerate} className="flex h-full flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h2 className="text-base font-semibold text-ink">Category Selection</h2>
                                <p className="mt-1 text-xs text-ink-muted">
                                    Pick the categories you want in your idea mix.
                                </p>
                            </div>
                            <Badge variant={selectedCount > 0 ? 'info' : 'neutral'}>
                                {selectedCount}/{categoryList.length} selected
                            </Badge>
                        </div>

                        <Input
                            value={categoryQuery}
                            onChange={(event) => setCategoryQuery(event.target.value)}
                            placeholder="Filter categories"
                            aria-label="Filter categories"
                        />

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="soft"
                                size="sm"
                                disabled={categoryList.length === 0 || isAllSelected}
                                onClick={handleSelectAll}
                            >
                                Select all
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={selectedCount === 0}
                                onClick={handleClearSelection}
                            >
                                Clear
                            </Button>
                        </div>

                        {isLoadingCategories ? (
                            <Notice variant="neutral">Loading categories...</Notice>
                        ) : null}

                        {!isLoadingCategories && categoryList.length === 0 ? (
                            <Notice variant="warning">No categories are available yet.</Notice>
                        ) : null}

                        {!isLoadingCategories && categoryList.length > 0 && visibleCategories.length === 0 ? (
                            <Notice variant="neutral">No categories match this filter.</Notice>
                        ) : null}

                        <div className="flex max-h-[420px] flex-col gap-2 overflow-auto pr-1">
                            {visibleCategories.map((category) => (
                                <Checkbox
                                    key={category.id}
                                    name={category.name}
                                    label={category.name}
                                    checked={selectedNameSet.has(category.name)}
                                    meta={`${category.keywords.length} keywords`}
                                    onChange={handleCheckboxChange}
                                />
                            ))}
                        </div>

                        <Button type="submit" variant="primary" className="mt-auto w-full" disabled={!canGenerate}>
                            {canGenerate ? 'Generate ideas' : 'Select categories first'}
                        </Button>
                    </form>
                </Card>

                <Card className="h-full">
                    {keywords.length > 0 ? (
                        <>
                            <CategoryHeader
                                title="Generated"
                                onClickCopy={() => {
                                    void copyToClipboard(
                                        keywords.map((keyword) => keyword.name).join(', '),
                                        { label: 'Generated list' },
                                    );
                                }}
                            />
                            <KeywordsList
                                keywords={keywords}
                                onClick={(keyword) => {
                                    void copyToClipboard(keyword.name, { label: 'Keyword' });
                                }}
                            />
                        </>
                    ) : (
                        <Notice variant="neutral">
                            Select categories and click <strong>Generate ideas</strong> to create a keyword set.
                        </Notice>
                    )}
                </Card>
            </div>

            {error ? (
                <Notice variant="error" className="mt-4">{error}</Notice>
            ) : null}
        </PageFrame>
    );
};
