import type { MouseEvent } from 'react';

import { Button } from '~/components/ui/Button';

interface CategoryHeaderProps {
    title: string;
    onClickCopy?: () => void;
    onContextMenu?: (event: MouseEvent<HTMLHeadingElement>) => void;
}

export const CategoryHeader = ({ title, onClickCopy, onContextMenu }: CategoryHeaderProps) => {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2
                className="text-base font-semibold text-ink"
                onContextMenu={onContextMenu}
            >
                {title}
            </h2>
            {onClickCopy ? (
                <Button variant="secondary" size="sm" onClick={onClickCopy}>
                    Copy all
                </Button>
            ) : null}
        </div>
    );
};
