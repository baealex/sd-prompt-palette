import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Keyword } from '~/models/types';

import { makeKeywordSortableId } from './dnd-ids';

interface SortableKeywordItemProps {
    categoryId: number;
    keyword: Keyword;
}

export const SortableKeywordItem = ({ categoryId, keyword }: SortableKeywordItemProps) => {
    const sortableId = makeKeywordSortableId(categoryId, keyword.id);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sortableId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`group relative list-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ${isDragging ? 'z-10 opacity-70' : ''}`}
        >
            <button
                type="button"
                className="w-full cursor-grab text-left active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                {keyword.name}
            </button>
            {keyword.image ? (
                <img
                    loading="lazy"
                    src={keyword.image.url}
                    alt={keyword.name}
                    className="pointer-events-none absolute -bottom-2 left-full z-20 hidden w-28 rounded-lg border border-slate-200 bg-white shadow-md group-hover:block"
                />
            ) : null}
        </li>
    );
};
