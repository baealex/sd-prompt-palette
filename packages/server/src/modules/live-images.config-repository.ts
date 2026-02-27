import path from 'path';

import { models } from '~/models';

import { LiveSyncConfig } from './live-images.types';
import { normalizeIngestMode } from './live-images.utils';

export class LiveImagesConfigRepository {
    async ensureLiveSyncTables(
        defaultWatchDir = path.resolve('watch'),
    ): Promise<void> {
        await models.liveSyncConfig.upsert({
            where: {
                id: 1,
            },
            update: {},
            create: {
                id: 1,
                watchDir: path.resolve(defaultWatchDir),
                ingestMode: 'copy',
                deleteSourceOnDelete: false,
                enabled: false,
            },
        });
    }

    async readConfig(
        defaultWatchDir = path.resolve('watch'),
    ): Promise<LiveSyncConfig> {
        const row = await models.liveSyncConfig.findUnique({
            where: {
                id: 1,
            },
        });

        const watchDir = row?.watchDir
            ? path.resolve(row.watchDir)
            : path.resolve(defaultWatchDir);
        const ingestMode = normalizeIngestMode(row?.ingestMode || 'copy');
        const deleteSourceOnDelete = Boolean(row?.deleteSourceOnDelete);
        const enabled = Boolean(row?.enabled);
        const updatedAt = row?.updatedAt ? row.updatedAt.getTime() : Date.now();

        return {
            watchDir,
            ingestMode,
            deleteSourceOnDelete,
            enabled,
            updatedAt,
        };
    }

    async writeConfig(config: LiveSyncConfig): Promise<void> {
        await models.liveSyncConfig.upsert({
            where: {
                id: 1,
            },
            update: {
                watchDir: config.watchDir,
                ingestMode: config.ingestMode,
                deleteSourceOnDelete: config.deleteSourceOnDelete,
                enabled: config.enabled,
            },
            create: {
                id: 1,
                watchDir: config.watchDir,
                ingestMode: config.ingestMode,
                deleteSourceOnDelete: config.deleteSourceOnDelete,
                enabled: config.enabled,
            },
        });
    }
}
