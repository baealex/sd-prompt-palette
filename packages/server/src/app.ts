import express, { type NextFunction, type Request, type Response } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import path from 'path';

import { expressLogger, logger } from './modules/logger';
import { schema } from './schema';
import { router } from './urls';

const clientDistDir = path.resolve('../client/dist');

export const app = express()
    .use(expressLogger)
    .use(
        express.static(clientDistDir, {
            extensions: ['html'],
        }),
    )
    .use(express.json({ limit: '50mb' }))
    .use(
        '/graphql',
        createHandler({
            schema,
            formatError(error) {
                logger.error(error.message);
                return error;
            },
        }),
    )
    .use('/assets/images/', express.static(path.resolve('public/assets/images/')))
    .use('/api/', router)
    .get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({
                message: 'Not Found',
            });
        }
        return res.sendFile(path.resolve('../client/dist/index.html'));
    })
    .use(
        (
            error: unknown,
            _req: Request,
            res: Response,
            _next: NextFunction,
        ) => {
            if (res.headersSent) {
                return;
            }

            if (error instanceof Error) {
                logger.error(error.stack || error.message);
            } else {
                logger.error(String(error));
            }

            res.status(500).send('Internal Server Error');
        },
    );
