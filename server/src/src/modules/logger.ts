import expressWinston from 'express-winston';
import winston from 'winston';

export const loggerConfig = {
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${[info.timestamp]}: ${info.message} ${JSON.stringify(info.meta)}`),
    ),
    colorize: true,
    expressFormat: true,
};

export default expressWinston.logger(loggerConfig);