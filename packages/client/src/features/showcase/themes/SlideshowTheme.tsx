import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { getCollections } from '~/api';
import { resolveCollectionSortOrder } from '~/features/collection/view-filter';
import { Button } from '~/components/ui/Button';
import { PauseIcon, PlayIcon } from '~/icons';
import { useShowcaseFilters } from '../use-showcase-filters';

const BATCH_SIZE = 30;

const shuffle = <T,>(items: T[]): T[] => {
    const copied = [...items];
    copied.sort(() => Math.random() - 0.5);
    return copied;
};

export const SlideshowTheme = () => {
    const { query, model, sort } = useShowcaseFilters();

    const { data, isPending } = useQuery({
        queryKey: ['collections', 'showcase-slideshow', query, model, sort],
        queryFn: async () => {
            const response = await getCollections({
                page: 1,
                limit: BATCH_SIZE,
                query,
                model,
                ...resolveCollectionSortOrder(sort),
            });
            return response.data.allCollections.collections.map((item) => ({
                id: item.id,
                title: item.title,
                prompt: item.prompt,
                negativePrompt: item.negativePrompt,
                image: item.image,
            }));
        },
    });

    const shuffled = useMemo(() => shuffle(data ?? []), [data]);
    const [index, setIndex] = useState(0);
    const [play, setPlay] = useState(true);

    useEffect(() => {
        if (!play || shuffled.length < 2) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % shuffled.length);
        }, 6000);

        return () => {
            window.clearInterval(timer);
        };
    }, [shuffled.length, play]);

    const activeSlide = shuffled[index] ?? null;

    if (isPending || !activeSlide) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-ink-inverse">
                Generating a show for you...
            </div>
        );
    }

    return (
        <>
            <section
                key={`${activeSlide.id}-${index}`}
                className="relative h-full w-full"
            >
                <div
                    className="absolute inset-[-12%] bg-cover bg-center blur-3xl"
                    style={{
                        backgroundImage: `url(${activeSlide.image.url})`,
                    }}
                />
                <img
                    src={activeSlide.image.url}
                    alt={activeSlide.title}
                    className="absolute inset-0 h-full w-full object-contain"
                />
                <div className="absolute left-6 top-20 z-20 rounded bg-black/45 px-3 py-2 text-sm font-semibold tracking-wide">
                    <Link
                        to="/collection/$id"
                        params={{ id: String(activeSlide.id) }}
                        className="underline decoration-transparent hover:decoration-white"
                    >
                        {activeSlide.title || '(untitled)'}
                    </Link>
                </div>
            </section>

            <Button
                variant="soft"
                onClick={() => setPlay((prev) => !prev)}
                className="fixed bottom-8 right-8 z-30 rounded-full border border-brand-300 bg-brand-100/90 text-brand-900 backdrop-blur"
            >
                {play ? (
                    <PauseIcon width={16} height={16} />
                ) : (
                    <PlayIcon width={16} height={16} />
                )}
                {play ? 'Pause' : 'Play'}
            </Button>
        </>
    );
};
