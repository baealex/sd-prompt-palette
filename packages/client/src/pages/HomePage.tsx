import { PageFrame } from '~/components/domain/PageFrame';
import { useHomeOverview } from '~/features/home/use-home-overview';

export const HomePage = () => {
    const overview = useHomeOverview();

    return (
        <PageFrame
            title="Home"
            description="Home shared-infra port verification: API and shared module wiring baseline."
        >
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Categories</p>
                    <p className="mt-1 text-xl font-semibold">{overview.loading ? '...' : overview.categoryCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Collections</p>
                    <p className="mt-1 text-xl font-semibold">{overview.loading ? '...' : overview.collectionTotal}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase text-slate-500">Live Enabled</p>
                    <p className="mt-1 text-xl font-semibold">
                        {overview.loading ? '...' : overview.liveEnabled === null ? 'Unknown' : overview.liveEnabled ? 'Yes' : 'No'}
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="text-xs uppercase text-slate-500">Sample Page Range</p>
                <p className="mt-1">{overview.samplePageRange.join(', ') || '-'}</p>
            </div>

            {overview.error ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{overview.error}</p>
            ) : null}
        </PageFrame>
    );
};
