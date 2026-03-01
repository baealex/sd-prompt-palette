import { Request, Response, NextFunction } from 'express';
import { Controller } from '~/types';
import { logger } from './logger';

export const useAsync = (callback: Controller) => {
    return function (req: Request, res: Response, next: NextFunction) {
        callback(req, res, next).catch((error: unknown) => {
            logger.error(errorMessage(error));
            next(error);
        });
    };
};

function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.stack || error.message;
    }
    return String(error);
}
