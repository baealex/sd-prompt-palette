import { LoaderIcon } from '~/icons';

interface ShowcaseLoadingProps {
    message?: string;
}

export const ShowcaseLoading = ({
    message = 'Preparing showcase...',
}: ShowcaseLoadingProps) => {
    return (
        <div
            aria-label="Showcase loading"
            className="flex h-full min-h-screen flex-col items-center justify-center gap-3 bg-black text-white/70"
        >
            <LoaderIcon className="h-8 w-8 animate-spin text-white/80" />
            <p className="text-sm font-semibold tracking-[0.06em]">{message}</p>
        </div>
    );
};
