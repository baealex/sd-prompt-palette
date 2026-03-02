import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { getCollections } from '~/api';
import { collectionQueryKeys } from '~/features/collection/query-keys';
import { toCollectionSummaryItems } from '~/entities/collection/mapper';
import { resolveCollectionSortOrder } from '~/features/collection/view-filter';
import { Image } from '~/components/ui/Image';
import { ArrowLeftIcon, ArrowRightIcon, HeartIcon, SearchIcon } from '~/icons';
import { ShowcaseLoading } from '~/features/showcase/ShowcaseLoading';
import { useShowcaseFilters } from '../use-showcase-filters';

const GRID_CHUNK_SIZE = 8;
const SECTION_COUNT = 6;
const PAGE_SIZE = GRID_CHUNK_SIZE * SECTION_COUNT; // 48

const SECTION_TITLES = [
    'New Arrivals',
    'Best Sellers',
    'Trending Now',
    'Staff Picks',
    'Just For You',
    "Editor's Choice",
];

const parsePageParam = (value: unknown): number => {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isInteger(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return 1;
};

export const MinimalStoreTheme = () => {
    const navigate = useNavigate();
    const { query, model, searchBy, dateField, dateFrom, dateTo, sort } =
        useShowcaseFilters();
    const page = useSearch({
        strict: false,
        select: (search) =>
            parsePageParam((search as Record<string, unknown>).page),
    });

    const { data, isPending } = useQuery({
        queryKey: collectionQueryKeys.showcase({
            theme: 'minimal-store',
            query,
            model,
            searchBy,
            dateField,
            dateFrom,
            dateTo,
            sort,
            page,
            limit: PAGE_SIZE,
        }),
        queryFn: async () => {
            const response = await getCollections({
                page,
                limit: PAGE_SIZE,
                query,
                model,
                searchBy,
                dateField,
                dateFrom,
                dateTo,
                ...resolveCollectionSortOrder(sort),
            });
            return {
                collections: toCollectionSummaryItems(
                    response.data.allCollections.collections,
                ),
                total: response.data.allCollections.pagination.total,
            };
        },
        placeholderData: (prev) => prev,
    });

    const collections = data?.collections ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const gridItems = collections;

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            void navigate({
                to: '/collection/showcase',
                replace: true,
                resetScroll: false,
                search: (prev) => ({
                    ...(prev as Record<string, unknown>),
                    page: totalPages > 1 ? totalPages : undefined,
                }),
            });
        }
    }, [navigate, page, totalPages]);

    const sections = useMemo(() => {
        const result: { title: string; items: typeof gridItems }[] = [];
        for (let i = 0; i < SECTION_COUNT; i++) {
            const chunk = gridItems.slice(
                i * GRID_CHUNK_SIZE,
                (i + 1) * GRID_CHUNK_SIZE,
            );
            if (chunk.length === 0) break;
            result.push({
                title: SECTION_TITLES[i],
                items: chunk,
            });
        }
        return result;
    }, [gridItems]);

    const handlePageChange = (nextPage: number) => {
        if (nextPage === page) {
            return;
        }
        void navigate({
            to: '/collection/showcase',
            replace: true,
            resetScroll: false,
            search: (prev) => ({
                ...(prev as Record<string, unknown>),
                page: nextPage > 1 ? nextPage : undefined,
            }),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isPending && collections.length === 0) {
        return <ShowcaseLoading />;
    }

    if (collections.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-white text-sm text-gray-400">
                No collections found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black">
            <div className="bg-black py-2 text-center text-[10px] uppercase tracking-[0.25em] text-white/80">
                Free worldwide shipping on all orders &mdash; Use code{' '}
                <span className="font-semibold text-white">PROMPT2026</span>
            </div>

            <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                    <span className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">
                        Prompt Gallery
                    </span>
                    <nav className="hidden items-center gap-8 md:flex">
                        {['New', 'Collection', 'Popular', 'About'].map(
                            (label, i) => (
                                <span
                                    key={label}
                                    className={`cursor-default text-xs uppercase tracking-[0.15em] transition-colors ${
                                        i === 0
                                            ? 'text-black'
                                            : 'text-gray-400 hover:text-black'
                                    }`}
                                >
                                    {label}
                                </span>
                            ),
                        )}
                    </nav>
                    <div className="flex items-center gap-4">
                        <SearchIcon
                            width={16}
                            height={16}
                            className="cursor-default text-gray-500"
                        />
                        <HeartIcon
                            width={16}
                            height={16}
                            className="cursor-default text-gray-500"
                        />
                        <span className="cursor-default text-xs text-gray-500">
                            Bag (0)
                        </span>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4">
                {sections.map((section, si) => (
                    <div key={si} className="py-10">
                        <div className="mb-8 flex items-end justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-lg font-light tracking-wide text-gray-900">
                                    {section.title}
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    {section.items.length} pieces
                                </p>
                            </div>
                            <span className="cursor-default text-[10px] uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-black">
                                View All
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                            {section.items.map((item, gi) => (
                                <Link
                                    key={item.id}
                                    to="/collection/$id"
                                    params={{ id: String(item.id) }}
                                    className="group relative"
                                >
                                    <div className="relative overflow-hidden bg-gray-50">
                                        {gi === 0 && si === 0 && (
                                            <span className="absolute left-2 top-2 z-10 bg-black px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white">
                                                New
                                            </span>
                                        )}
                                        <Image
                                            src={item.image.url}
                                            alt={item.title}
                                            width={item.image.width}
                                            height={item.image.height}
                                            className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                                                <HeartIcon
                                                    width={14}
                                                    height={14}
                                                    className="text-gray-600"
                                                />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="line-clamp-1 text-sm text-gray-900">
                                            {item.title || '(untitled)'}
                                        </p>
                                        {item.prompt && (
                                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                                                {item.prompt}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 border-t border-gray-100 py-10">
                        <button
                            disabled={page <= 1}
                            onClick={() => handlePageChange(page - 1)}
                            className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-gray-500 transition-colors hover:text-black disabled:opacity-30 disabled:hover:text-gray-500"
                        >
                            <ArrowLeftIcon width={12} height={12} />
                            Prev
                        </button>
                        <span className="text-xs tabular-nums text-gray-400">
                            {page} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(page + 1)}
                            className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-gray-500 transition-colors hover:text-black disabled:opacity-30 disabled:hover:text-gray-500"
                        >
                            Next
                            <ArrowRightIcon width={12} height={12} />
                        </button>
                    </div>
                )}
            </main>

            <div className="border-t border-gray-100 bg-gray-50 py-16 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Stay in the loop
                </p>
                <h3 className="mt-2 text-lg font-light text-gray-900">
                    Subscribe to our newsletter
                </h3>
                <div className="mx-auto mt-5 flex max-w-sm border border-gray-300">
                    <div className="flex-1 px-4 py-2.5 text-left text-xs text-gray-300">
                        Enter your email address
                    </div>
                    <div className="bg-black px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white">
                        Subscribe
                    </div>
                </div>
            </div>

            <footer className="border-t border-gray-100 bg-white px-6 py-12">
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-900">
                            Shop
                        </h4>
                        <ul className="mt-3 space-y-2 text-xs text-gray-400">
                            <li>New Arrivals</li>
                            <li>Best Sellers</li>
                            <li>Collections</li>
                            <li>Sale</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-900">
                            Help
                        </h4>
                        <ul className="mt-3 space-y-2 text-xs text-gray-400">
                            <li>Contact Us</li>
                            <li>Shipping</li>
                            <li>Returns</li>
                            <li>FAQ</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-900">
                            About
                        </h4>
                        <ul className="mt-3 space-y-2 text-xs text-gray-400">
                            <li>Our Story</li>
                            <li>Sustainability</li>
                            <li>Careers</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-900">
                            Follow Us
                        </h4>
                        <ul className="mt-3 space-y-2 text-xs text-gray-400">
                            <li>Instagram</li>
                            <li>Twitter</li>
                            <li>Pinterest</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 border-t border-gray-100 pt-6 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300">
                        &copy; 2026 Prompt Gallery. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};
