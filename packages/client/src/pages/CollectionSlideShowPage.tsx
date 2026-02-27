import { PageFrame } from '~/components/domain/PageFrame';

export const CollectionSlideShowPage = () => {
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <PageFrame
                title="Collection Slideshow"
                description="This route intentionally bypasses the standard layout and will host slideshow/fullscreen behavior."
            />
        </div>
    );
};
