import express from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import path from 'path';

import expressLogger, { logger } from './modules/logger';
import router from './urls';
import schema from './schema';

export default express()
    .use(expressLogger)
    .use(express.static(path.resolve('client/dist'), {
        extensions: ['html']
    }))
    .use(express.json({ limit: '50mb' }))
    .use('/graphql', createHandler({
        schema,
        formatError(error) {
            logger.error(error.message);
            return error;
        },
    }))
    .use('/assets/images/', express.static(path.resolve('public/assets/images/')))
    .use('/api/', router)
    .get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({
                message: 'Not Found',
            });
        }
        res.sendFile(path.resolve('client/dist/index.html'));
    });
