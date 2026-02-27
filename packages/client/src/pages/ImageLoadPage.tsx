import { CategoryHeader } from '~/components/domain/CategoryHeader';
import { KeywordsList } from '~/components/domain/KeywordsList';
import { PageFrame } from '~/components/domain/PageFrame';
import { useImageLoad } from '~/features/image-load/use-image-load';
import { HeartIcon } from '~/icons';
import type { Keyword } from '~/models/types';

const toKeywords = (text: string): Keyword[] => {
    return text
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value, index) => ({
            id: index,
            name: value,
        }));
};

const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
};

export const ImageLoadPage = () => {
    const {
        loading,
        error,
        parsedPrompt,
        uploadedImage,
        savedCollectionId,
        onFile,
        upload,
        saveToCollection,
    } = useImageLoad();

    const promptKeywords = parsedPrompt ? toKeywords(parsedPrompt.prompt) : [];
    const negativePromptKeywords = parsedPrompt ? toKeywords(parsedPrompt.negativePrompt) : [];

    return (
        <PageFrame
            title="Image Load"
            description="Read prompt metadata and save it directly to collection."
        >
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-700"
                />
                <button
                    type="button"
                    onClick={() => void upload()}
                    disabled={loading}
                    className="mt-3 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {loading ? 'Processing...' : 'Upload'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const title = window.prompt('Enter a title for this collection');
                        if (!title || !title.trim()) {
                            return;
                        }
                        void saveToCollection(title.trim());
                    }}
                    disabled={loading}
                    className="ml-2 mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-400 disabled:text-slate-400"
                >
                    <HeartIcon width={14} height={14} />
                    Save to Collection
                </button>
            </div>

            {parsedPrompt ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <CategoryHeader
                        title="Prompt"
                        onClickCopy={() => {
                            void copyText(parsedPrompt.prompt);
                        }}
                    />
                    <KeywordsList
                        keywords={promptKeywords}
                        onClick={(keyword) => {
                            void copyText(keyword.name);
                        }}
                    />
                    <CategoryHeader
                        title="Negative Prompt"
                        onClickCopy={() => {
                            void copyText(parsedPrompt.negativePrompt);
                        }}
                    />
                    <KeywordsList
                        keywords={negativePromptKeywords}
                        onClick={(keyword) => {
                            void copyText(keyword.name);
                        }}
                    />
                </div>
            ) : null}

            {uploadedImage ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="text-xs uppercase text-slate-500">Uploaded Image</p>
                    <p className="mt-1">ID: {uploadedImage.id}</p>
                    <p>Size: {uploadedImage.width} x {uploadedImage.height}</p>
                    <a className="text-brand-700 underline" href={uploadedImage.url} target="_blank" rel="noreferrer">
                        Open Uploaded Asset
                    </a>
                </div>
            ) : null}

            {savedCollectionId ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Saved to collection #{savedCollectionId}.{' '}
                    <a href={`/collection/${savedCollectionId}`} className="underline">
                        Open detail
                    </a>
                </div>
            ) : null}

            {error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}
        </PageFrame>
    );
};
