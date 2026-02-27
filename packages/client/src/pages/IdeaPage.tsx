import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { getCategories } from '~/api';
import { CategoryHeader } from '~/components/domain/CategoryHeader';
import { Checkbox } from '~/components/domain/Checkbox';
import { KeywordsList } from '~/components/domain/KeywordsList';
import { PageFrame } from '~/components/domain/PageFrame';
import type { Category, Keyword } from '~/models/types';
import { useMemoState } from '~/modules/memo';

const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

export const IdeaPage = () => {
    const [categories, setMemoCategories] = useMemoState<Category[]>(['categories'], []);
    const [generatedKeywords, setMemoKeywords] = useMemoState<Keyword[]>(['generated', 'keywords'], []);
    const [selected, setMemoSelected] = useMemoState<string[]>(['selected'], categories.map((category) => category.name));

    const [categoryList, setCategoryList] = useState<Category[]>(categories);
    const [keywords, setKeywords] = useState<Keyword[]>(generatedKeywords);
    const [selectedNames, setSelectedNames] = useState<string[]>(selected);
    const [error, setError] = useState<string | null>(null);

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
                setSelectedNames((prev) => (prev.length > 0 ? prev : nextCategories.map((category) => category.name)));
            } catch (nextError) {
                if (cancelled) {
                    return;
                }
                setError(nextError instanceof Error ? nextError.message : 'Failed to load categories');
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

    const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextKeywords = categoryList
            .filter((category) => selectedNames.includes(category.name))
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
            description="Generate one random keyword from each selected category."
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
                <form
                    onSubmit={handleGenerate}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                >
                    <div className="flex flex-col gap-2">
                        {categoryList.map((category) => (
                            <Checkbox
                                key={category.id}
                                name={category.name}
                                label={category.name}
                                checked={selectedNames.includes(category.name)}
                                onChange={handleCheckboxChange}
                            />
                        ))}
                    </div>
                    <button
                        type="submit"
                        className="mt-4 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                        Generate
                    </button>
                </form>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    {keywords.length > 0 ? (
                        <>
                            <CategoryHeader
                                title="Generated"
                                onClickCopy={() => {
                                    void copyText(keywords.map((keyword) => keyword.name).join(', '));
                                }}
                            />
                            <KeywordsList
                                keywords={keywords}
                                onClick={(keyword) => {
                                    void copyText(keyword.name);
                                }}
                            />
                        </>
                    ) : (
                        <p className="text-sm text-slate-600">Choose categories and generate ideas.</p>
                    )}
                </div>
            </div>

            {error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}
        </PageFrame>
    );
};
