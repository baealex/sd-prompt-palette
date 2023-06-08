import express from 'express';
import path from 'path';

import logger from './modules/logger';
import router from './urls';

export default express()
    .use(logger)
    .use(express.static(path.resolve('client/dist'), {
        extensions: ['html']
    }))
    .use(express.json())
    .use('/api/', router);
