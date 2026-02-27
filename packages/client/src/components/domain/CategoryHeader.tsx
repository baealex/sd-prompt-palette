import type { MouseEvent } from 'react';

interface CategoryHeaderProps {
    title: string;
    onClickCopy?: () => void;
    onContextMenu?: (event: MouseEvent<HTMLHeadingElement>) => void;
}

export const CategoryHeader = ({ title, onClickCopy, onContextMenu }: CategoryHeaderProps) => {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2
                className="text-base font-semibold text-slate-900"
                onContextMenu={onContextMenu}
            >
                {title}
            </h2>
            {onClickCopy ? (
                <button
                    type="button"
                    onClick={onClickCopy}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                    Copy all
                </button>
            ) : null}
        </div>
    );
};
