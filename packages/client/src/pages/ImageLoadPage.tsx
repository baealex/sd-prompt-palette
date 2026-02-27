import { PageFrame } from '~/components/domain/PageFrame';
import { useImageLoad } from '~/features/image-load/use-image-load';

export default function ImageLoadPage() {
    const {
        loading,
        error,
        parsedPrompt,
        uploadedImage,
        onFile,
        upload,
    } = useImageLoad();

    return (
        <PageFrame
            title="Image Load"
            description="Image module and upload API port verification."
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
            </div>

            {parsedPrompt ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="text-xs uppercase text-slate-500">Prompt</p>
                    <p className="mt-1">{parsedPrompt.prompt || '-'}</p>
                    <p className="mt-3 text-xs uppercase text-slate-500">Negative Prompt</p>
                    <p className="mt-1">{parsedPrompt.negativePrompt || '-'}</p>
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

            {error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            ) : null}
        </PageFrame>
    );
}
