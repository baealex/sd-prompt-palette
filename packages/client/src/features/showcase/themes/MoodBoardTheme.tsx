import { Link } from '@tanstack/react-router';

import { Image } from '~/components/domain/Image';
import { useShowcaseInfinite } from '../use-showcase-infinite';

const ROTATIONS = [
    '-rotate-2',
    'rotate-1',
    '-rotate-1',
    'rotate-2',
    'rotate-0',
    '-rotate-3',
    'rotate-3',
];

const SPANS = [
    'row-span-2',
    '',
    '',
    'row-span-2',
    '',
    '',
    '',
    'row-span-2',
];

export const MoodBoardTheme = () => {
    const { collections, sentinelRef, loading, isFetchingNextPage } =
        useShowcaseInfinite('moodboard');

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-sm text-white/60">
                Curating your mood board...
            </div>
        );
    }

    if (collections.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center text-sm text-white/60">
                No collections found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 px-3 pb-20 pt-14 sm:px-4 sm:pb-24 sm:pt-20">
            <div className="mx-auto grid max-w-7xl auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 md:grid-cols-4 lg:auto-rows-[260px]">
                {collections.map((item, i) => (
                    <Link
                        key={item.id}
                        to="/collection/$id"
                        params={{ id: String(item.id) }}
                        className={`group relative overflow-hidden rounded-sm ${SPANS[i % SPANS.length]} transition-transform duration-300 hover:z-10 hover:scale-[1.03] ${ROTATIONS[i % ROTATIONS.length]}`}
                    >
                        <Image
                            src={item.image.url}
                            alt={item.title}
                            width={item.image.width}
                            height={item.image.height}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <p className="text-xs font-medium text-white drop-shadow">
                                {item.title || '(untitled)'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            <div ref={sentinelRef} className="mt-8 text-center">
                {isFetchingNextPage && (
                    <p className="text-xs text-white/40">Loading more...</p>
                )}
            </div>
        </div>
    );
};
