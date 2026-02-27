import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';

import { getCollections } from '~/api';
import { Button } from '~/components/ui/Button';
import { Notice } from '~/components/ui/Notice';
import { PauseIcon, PlayIcon } from '~/icons';
import type { Collection } from '~/models/types';

const LIMIT = 9999;

const shuffleCollections = (items: Collection[]) => {
    const copied = [...items];
    copied.sort(() => Math.random() - 0.5);
    return copied;
};

export const CollectionSlideShowPage = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [index, setIndex] = useState(0);
    const [play, setPlay] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const load = async () => {
            try {
                const response = await getCollections({ page: 1, limit: LIMIT });
                if (cancelled) {
                    return;
                }
                setCollections(shuffleCollections(response.data.allCollections.collections));
            } catch (nextError) {
                if (cancelled) {
                    return;
                }
                setError(nextError instanceof Error ? nextError.message : 'Failed to load slideshow');
            }
        };

        void load();

        return () => {
            cancelled = true;
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    useEffect(() => {
        if (!play || collections.length < 2) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((prev) => {
                const next = prev + 1;
                if (next < collections.length) {
                    return next;
                }
                return 0;
            });
        }, 6000);

        return () => {
            window.clearInterval(timer);
        };
    }, [collections.length, play]);

    const activeSlide = collections[index] ?? null;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black text-white">
            {error ? (
                <Notice variant="error" className="absolute left-1/2 top-8 z-30 -translate-x-1/2">{error}</Notice>
            ) : null}

            {!activeSlide ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-200">
                    Generating a show for you...
                </div>
            ) : (
                <div className="h-full">
                    <section key={`${activeSlide.id}-${index}`} className="relative h-full w-full">
                        <div
                            className="absolute inset-[-12%] bg-cover bg-center blur-3xl"
                            style={{ backgroundImage: `url(${activeSlide.image.url})` }}
                        />
                        <img
                            src={activeSlide.image.url}
                            alt={activeSlide.title}
                            className="absolute inset-0 h-full w-full object-contain"
                        />
                        <div className="absolute left-6 top-6 z-20 rounded bg-black/45 px-3 py-2 text-sm font-semibold tracking-wide">
                            <Link
                                to="/collection/$id"
                                params={{ id: String(activeSlide.id) }}
                                className="underline decoration-transparent hover:decoration-white"
                            >
                                {activeSlide.title || '(untitled)'}
                            </Link>
                        </div>
                    </section>
                </div>
            )}

            <Button
                variant="soft"
                onClick={() => setPlay((prev) => !prev)}
                className="fixed bottom-8 right-8 z-30 rounded-full border border-brand-300 bg-brand-100/90 text-brand-900 backdrop-blur"
            >
                {play ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
                {play ? 'Pause' : 'Play'}
            </Button>
        </div>
    );
};
