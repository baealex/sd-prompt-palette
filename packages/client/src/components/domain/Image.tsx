import { useEffect, useRef } from 'react';

interface ImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

const toPreviewUrl = (src: string) => {
    const lastDot = src.lastIndexOf('.');
    if (lastDot < 0) {
        return src;
    }

    return `${src.slice(0, lastDot)}.preview.jpg`;
};

export const Image = ({ src, alt, width, height, className }: ImageProps) => {
    const ref = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        const target = ref.current;
        if (!target || !src) {
            return;
        }

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const image = entry.target as HTMLImageElement;
                const realSource = image.dataset.src;
                if (realSource) {
                    image.src = realSource;
                }
                currentObserver.unobserve(image);
            });
        });

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [src]);

    return (
        <img
            ref={ref}
            className={className}
            src={toPreviewUrl(src)}
            data-src={src}
            width={width ?? undefined}
            height={height ?? undefined}
            alt={alt}
            loading="lazy"
        />
    );
};
