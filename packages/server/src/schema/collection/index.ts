import { IResolvers } from '@graphql-tools/utils';
import dayjs from 'dayjs';

import { Collection, ImageMeta, Prisma, models } from '~/models';
import { gql } from '~/modules/graphql';
import { liveImagesService } from '~/modules/live-images';
import { toParsedMetadata } from '~/modules/live-images.metadata';

type AllCollectionsOrder = 'asc' | 'desc';
type AllCollectionsSearchBy = 'title' | 'prompt' | 'negative_prompt';
type AllCollectionsDateField = 'collection_added' | 'generated_at';

const DEFAULT_COLLECTION_LIMIT = 60;
const MAX_COLLECTION_LIMIT = 200;

type CollectionWithImageMeta = Prisma.CollectionGetPayload<{
    include: {
        image: {
            include: {
                meta: true;
            };
        };
    };
}>;

interface CollectionPaginationPayload {
    limit: number;
    offset: number;
    total: number;
}

interface AllCollectionsPayload {
    collections: CollectionWithImageMeta[];
    pagination: CollectionPaginationPayload;
}

interface AllCollectionsQueryArgs {
    orderBy?: string;
    order?: string;
    query?: string;
    model?: string;
    searchBy?: string;
    dateField?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}

const resolveCollectionQueryFilter = (
    query: string,
    searchBy?: AllCollectionsSearchBy,
): Prisma.CollectionWhereInput => {
    if (searchBy === 'title') {
        return {
            title: {
                contains: query,
            },
        };
    }

    if (searchBy === 'prompt') {
        return {
            prompt: {
                contains: query,
            },
        };
    }

    if (searchBy === 'negative_prompt') {
        return {
            negativePrompt: {
                contains: query,
            },
        };
    }

    return {
        OR: [
            {
                title: {
                    contains: query,
                },
            },
            {
                prompt: {
                    contains: query,
                },
            },
            {
                negativePrompt: {
                    contains: query,
                },
            },
        ],
    };
};

const parseCollectionDateValue = (input?: string) => {
    if (!input) {
        return null;
    }

    const normalized = input.trim();
    if (!normalized) {
        return null;
    }

    const parsed = dayjs(normalized);
    if (!parsed.isValid()) {
        return null;
    }

    return parsed.toDate();
};

const resolveCollectionDateFilter = (
    dateField?: AllCollectionsDateField,
    dateFrom?: string,
    dateTo?: string,
): Prisma.CollectionWhereInput | null => {
    let parsedFrom = parseCollectionDateValue(dateFrom);
    let parsedTo = parseCollectionDateValue(dateTo);

    if (!parsedFrom && !parsedTo) {
        return null;
    }

    if (parsedFrom && parsedTo && parsedFrom.getTime() > parsedTo.getTime()) {
        [parsedFrom, parsedTo] = [parsedTo, parsedFrom];
    }

    const range: Prisma.DateTimeFilter = {};
    if (parsedFrom) {
        range.gte = parsedFrom;
    }
    if (parsedTo) {
        range.lte = parsedTo;
    }

    if (dateField === 'generated_at') {
        return {
            image: {
                generatedAt: range,
            },
        };
    }

    return {
        createdAt: range,
    };
};

function resolveCollectionOrderBy(
    orderBy?: string,
    order: AllCollectionsOrder = 'desc',
) {
    const normalizedOrder = order === 'asc' ? 'asc' : 'desc';
    if (
        orderBy === 'generatedAt' ||
        orderBy === 'fileCreatedAt' ||
        orderBy === 'fileModifiedAt'
    ) {
        return {
            image: {
                generatedAt: normalizedOrder,
            },
        } as const;
    }
    return {
        [orderBy || 'createdAt']: normalizedOrder,
    } as const;
}

function normalizeOrder(input: string | undefined): AllCollectionsOrder {
    return input === 'asc' ? 'asc' : 'desc';
}

function normalizeSearchBy(
    input: string | undefined,
): AllCollectionsSearchBy | undefined {
    if (input === 'title' || input === 'prompt' || input === 'negative_prompt') {
        return input;
    }
    return undefined;
}

function normalizeDateField(
    input: string | undefined,
): AllCollectionsDateField | undefined {
    if (input === 'collection_added' || input === 'generated_at') {
        return input;
    }
    return undefined;
}

function normalizeLimit(input: number | undefined): number {
    if (!Number.isFinite(input) || !input || input <= 0) {
        return DEFAULT_COLLECTION_LIMIT;
    }
    return Math.min(Math.trunc(input), MAX_COLLECTION_LIMIT);
}

function normalizeOffset(input: number | undefined): number {
    if (!Number.isFinite(input) || input === undefined || input < 0) {
        return 0;
    }
    return Math.trunc(input);
}

function resolveLoadedImage(
    collection: Collection | CollectionWithImageMeta,
): CollectionWithImageMeta['image'] | null {
    if ('image' in collection) {
        return collection.image;
    }
    return null;
}

function toGeneratedMetadataPayload(metadata: ImageMeta | null) {
    if (!metadata) {
        return null;
    }

    const parsed = toParsedMetadata(metadata);
    return {
        sourceType: parsed.sourceType || 'unknown',
        prompt: parsed.prompt || '',
        negativePrompt: parsed.negativePrompt || '',
        model: parsed.model,
        modelHash: parsed.modelHash,
        baseSampler: parsed.baseSampler,
        baseScheduler: parsed.baseScheduler,
        baseSteps: parsed.baseSteps,
        baseCfgScale: parsed.baseCfgScale,
        baseSeed: parsed.baseSeed,
        upscaleSampler: parsed.upscaleSampler,
        upscaleScheduler: parsed.upscaleScheduler,
        upscaleSteps: parsed.upscaleSteps,
        upscaleCfgScale: parsed.upscaleCfgScale,
        upscaleSeed: parsed.upscaleSeed,
        upscaleFactor: parsed.upscaleFactor,
        upscaler: parsed.upscaler,
        sizeWidth: parsed.sizeWidth,
        sizeHeight: parsed.sizeHeight,
        clipSkip: parsed.clipSkip,
        vae: parsed.vae,
        denoiseStrength: parsed.denoiseStrength,
        parseWarnings: parsed.parseWarnings,
        parseVersion: parsed.parseVersion || '',
    };
}

export const CollectionType = gql`
    type Collection {
        id: ID!
        image: Image!
        title: String!
        prompt: String!
        negativePrompt: String!
        generatedAt: String
        generatedMetadata: GeneratedMetadata
        createdAt: String!
        updatedAt: String!
    }

    type GeneratedMetadata {
        sourceType: String!
        prompt: String!
        negativePrompt: String!
        model: String
        modelHash: String
        baseSampler: String
        baseScheduler: String
        baseSteps: Int
        baseCfgScale: Float
        baseSeed: String
        upscaleSampler: String
        upscaleScheduler: String
        upscaleSteps: Int
        upscaleCfgScale: Float
        upscaleSeed: String
        upscaleFactor: Float
        upscaler: String
        sizeWidth: Int
        sizeHeight: Int
        clipSkip: Int
        vae: String
        denoiseStrength: Float
        parseWarnings: [String!]!
        parseVersion: String!
    }

    type Image {
        id: ID!
        url: String!
        width: Int!
        height: Int!
        createdAt: String!
    }

    type Pagination {
        limit: Int!
        offset: Int!
        total: Int!
    }

    type AllCollections {
        collections: [Collection!]!
        pagination: Pagination!
    }
`;

export const CollectionQuery = gql`
    type Query {
        collectionModelOptions: [String!]!
        allCollections(orderBy: String, order: String, query: String, model: String, searchBy: String, dateField: String, dateFrom: String, dateTo: String, limit: Int, offset: Int): AllCollections!
        collection(id: ID!): Collection!
    }
`;

export const CollectionMutation = gql`
    type Mutation {
        createCollection(imageId: ID!, title: String!, prompt: String!, negativePrompt: String!): Collection!
        updateCollection(id: ID!, imageId: ID, title: String, prompt: String, negativePrompt: String): Collection!
        deleteCollection(id: ID!): Boolean!
    }
`;

export const CollectionTypeDefs = `
    ${CollectionType}
    ${CollectionQuery}
    ${CollectionMutation}
`;

export const CollectionResolvers: IResolvers = {
    Query: {
        collectionModelOptions: async () => {
            const metas = await models.imageMeta.findMany({
                where: {
                    model: {
                        not: null,
                    },
                },
                select: {
                    model: true,
                },
                distinct: ['model'],
                orderBy: {
                    model: 'asc',
                },
            });

            return metas
                .map((meta) => meta.model?.trim())
                .filter((model): model is string => Boolean(model));
        },
        allCollections: async (
            _,
            {
                orderBy,
                order,
                query,
                model,
                searchBy,
                dateField,
                dateFrom,
                dateTo,
                limit,
                offset,
            }: AllCollectionsQueryArgs,
        ): Promise<AllCollectionsPayload> => {
            const normalizedQuery = query?.trim() || '';
            const normalizedModel = model?.trim() || '';
            const normalizedLimit = normalizeLimit(limit);
            const normalizedOffset = normalizeOffset(offset);
            const filters: Prisma.CollectionWhereInput[] = [];

            if (normalizedQuery) {
                filters.push(
                    resolveCollectionQueryFilter(
                        normalizedQuery,
                        normalizeSearchBy(searchBy),
                    ),
                );
            }

            if (normalizedModel) {
                filters.push({
                    image: {
                        meta: {
                            is: {
                                model: {
                                    contains: normalizedModel,
                                },
                            },
                        },
                    },
                });
            }

            const dateFilter = resolveCollectionDateFilter(
                normalizeDateField(dateField),
                dateFrom,
                dateTo,
            );
            if (dateFilter) {
                filters.push(dateFilter);
            }

            const where =
                filters.length === 0
                    ? undefined
                    : filters.length === 1
                      ? filters[0]
                      : {
                            AND: filters,
                        };

            const [collections, total] = await Promise.all([
                models.collection.findMany({
                    orderBy: resolveCollectionOrderBy(
                        orderBy,
                        normalizeOrder(order),
                    ),
                    where,
                    take: normalizedLimit,
                    skip: normalizedOffset,
                    include: {
                        image: {
                            include: {
                                meta: true,
                            },
                        },
                    },
                }),
                models.collection.count({ where }),
            ]);

            return {
                collections,
                pagination: {
                    limit: normalizedLimit,
                    offset: normalizedOffset,
                    total,
                },
            };
        },
        collection: (_, { id }: Collection) =>
            models.collection.findUnique({
                where: {
                    id: Number(id),
                },
                include: {
                    image: {
                        include: {
                            meta: true,
                        },
                    },
                },
            }),
    },
    Mutation: {
        createCollection: async (
            _,
            { imageId, title, prompt, negativePrompt }: Collection,
        ) => {
            imageId = Number(imageId);

            const collection = await models.collection.create({
                data: {
                    image: {
                        connect: {
                            id: imageId,
                        },
                    },
                    title,
                    prompt,
                    negativePrompt,
                },
            });

            liveImagesService.notifyCollectionsChanged('gql:createCollection');
            return collection;
        },
        updateCollection: async (
            _,
            { id, imageId, title, prompt, negativePrompt }: Partial<Collection>,
        ) => {
            id = Number(id);
            imageId = Number(imageId);

            const collection = await models.collection.update({
                where: {
                    id,
                },
                data: {
                    image: imageId
                        ? {
                              connect: {
                                  id: imageId,
                              },
                          }
                        : undefined,
                    title,
                    prompt,
                    negativePrompt,
                },
            });

            liveImagesService.notifyCollectionsChanged('gql:updateCollection');
            return collection;
        },
        deleteCollection: async (_, { id }: Collection) => {
            id = Number(id);

            const imageId = await models.$transaction(async (tx) => {
                const target = await tx.collection.findUnique({
                    where: {
                        id,
                    },
                    select: {
                        id: true,
                        imageId: true,
                    },
                });

                if (!target) {
                    throw new Error('Collection not found');
                }

                await tx.collection.delete({
                    where: {
                        id: target.id,
                    },
                });

                return target.imageId;
            });

            const deletedOrphan = await liveImagesService.deleteImageIfOrphan(
                imageId,
                'gql:deleteCollection',
            );

            if (!deletedOrphan) {
                liveImagesService.notifyCollectionsChanged(
                    'gql:deleteCollection',
                );
            }

            return true;
        },
    },
    Collection: {
        image: async (collection: Collection | CollectionWithImageMeta) => {
            const loadedImage = resolveLoadedImage(collection);
            if (loadedImage) {
                return loadedImage;
            }
            return models.image.findUnique({
                where: {
                    id: collection.imageId,
                },
            });
        },
        generatedAt: async (collection: Collection | CollectionWithImageMeta) => {
            const loadedImage = resolveLoadedImage(collection);
            if (loadedImage) {
                return loadedImage.generatedAt?.toISOString?.() || null;
            }

            const image = await models.image.findUnique({
                where: { id: collection.imageId },
                select: { generatedAt: true },
            });
            return image?.generatedAt?.toISOString?.() || null;
        },
        generatedMetadata: async (
            collection: Collection | CollectionWithImageMeta,
        ) => {
            const loadedImage = resolveLoadedImage(collection);
            if (loadedImage) {
                return toGeneratedMetadataPayload(loadedImage.meta || null);
            }

            const metadata = await models.imageMeta.findUnique({
                where: {
                    imageId: collection.imageId,
                },
            });
            return toGeneratedMetadataPayload(metadata);
        },
    },
};
