import { PageFrame } from '~/components/domain/PageFrame';
import { useIdeaGenerator } from '~/features/idea/use-idea-generator';

export const IdeaPage = () => {
    const { idea, generate } = useIdeaGenerator();

    return (
        <PageFrame
            title="Idea"
            description="Memo-state port verification. Generates and persists the latest idea in module memo storage."
        >
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-700">{idea}</p>
                <button
                    type="button"
                    onClick={generate}
                    className="mt-3 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                    Generate Idea
                </button>
            </div>
        </PageFrame>
    );
};
