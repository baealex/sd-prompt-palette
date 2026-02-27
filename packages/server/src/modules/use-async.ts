import { Request, Response, NextFunction } from 'express';
import { Controller } from '~/types';
import { logger } from './logger';

export const useAsync = (callback: Controller) => {
    return function (req: Request, res: Response, next: NextFunction) {
        callback(req, res, next).catch((e: Error) => {
            res.status(500).send('Internal Server Error');
            logger.error(e);
            next();
        });
    };
};
