import { PageFrame } from '~/components/domain/PageFrame';

interface CollectionDetailPageProps {
    id: string;
}

export const CollectionDetailPage = ({ id }: CollectionDetailPageProps) => {
    return (
        <PageFrame
            title={`Collection Detail #${id}`}
            description="Detail page behavior (keywords, prompts, image cards) will be migrated in the page migration phase."
        />
    );
};
