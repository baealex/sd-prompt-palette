import app from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import liveImagesService from './modules/live-images';
import { logger } from './modules/logger';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: { origin: true },
});

async function bootstrap() {
    await liveImagesService.init(io);

    server.listen(PORT, () => {
        logger.info(`http server listen on :${PORT}`);
    });
}

async function shutdown(signal: string) {
    logger.info(`received ${signal}, shutting down...`);
    await liveImagesService.close();
    io.close();
    server.close(() => {
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
    logger.error(`server bootstrap failed: ${error?.stack || error?.message || String(error)}`);
    process.exit(1);
});
