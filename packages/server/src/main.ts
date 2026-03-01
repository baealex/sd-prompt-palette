import { app } from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { liveImagesService } from './modules/live-images';
import { logger } from './modules/logger';
import { models } from './models';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: true },
});
let shuttingDown = false;

async function bootstrap() {
    await liveImagesService.init(io);

    server.listen(PORT, () => {
        logger.info(`http server listen on :${PORT}`);
    });
}

async function shutdown(signal: string) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;

    logger.info(`received ${signal}, shutting down...`);
    try {
        await liveImagesService.close();
    } catch (error: unknown) {
        logger.error(
            `live-images shutdown failed: ${error instanceof Error ? (error.stack || error.message) : String(error)}`,
        );
    }

    try {
        await models.$disconnect();
    } catch (error: unknown) {
        logger.error(
            `database disconnect failed: ${error instanceof Error ? (error.stack || error.message) : String(error)}`,
        );
    }

    io.close();
    server.close((error?: Error) => {
        if (error) {
            logger.error(
                `server close failed: ${error?.stack || error?.message || String(error)}`,
            );
            process.exit(1);
            return;
        }

        process.exit(0);
    });
}

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

bootstrap().catch((error: Error) => {
    logger.error(
        `server bootstrap failed: ${error?.stack || error?.message || String(error)}`,
    );
    process.exit(1);
});
