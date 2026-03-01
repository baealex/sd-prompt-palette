import { useEffect, useRef } from 'react';

interface ImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

const PLACEHOLDER_IMAGE_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P48P/LfwAJqQPjouwnvAAAABBkZUJHNEFEMEE0QUQxNTkzRDgwNIe1oJIAAAAASUVORK5CYII=';

export const Image = ({ src, alt, width, height, className }: ImageProps) => {
    const ref = useRef<HTMLImageElement | null>(null);
    const normalizedWidth =
        typeof width === 'number' && Number.isFinite(width) && width > 0
            ? width
            : undefined;
    const normalizedHeight =
        typeof height === 'number' && Number.isFinite(height) && height > 0
            ? height
            : undefined;
    const aspectRatio =
        normalizedWidth && normalizedHeight
            ? `${normalizedWidth} / ${normalizedHeight}`
            : undefined;

    useEffect(() => {
        const target = ref.current;
        if (!target) {
            return;
        }

        target.dataset.src = src;
        target.src = PLACEHOLDER_IMAGE_DATA_URL;

        const loadRealSource = () => {
            const realSource = target.dataset.src;
            if (realSource) {
                target.src = realSource;
            }
        };

        if (typeof IntersectionObserver === 'undefined') {
            loadRealSource();
            return;
        }

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                loadRealSource();
                currentObserver.unobserve(entry.target);
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
            src={PLACEHOLDER_IMAGE_DATA_URL}
            data-src={src}
            width={normalizedWidth}
            height={normalizedHeight}
            style={aspectRatio ? { aspectRatio } : undefined}
            alt={alt}
            loading="lazy"
        />
    );
};
