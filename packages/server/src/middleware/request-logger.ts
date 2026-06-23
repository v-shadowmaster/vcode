import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/** Logs one structured line per request once the response has been sent. */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const length = Number(res.getHeader('content-length')) || 0;

    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      durationMs,
      length,
      ip: req.ip,
    });
  });

  next();
};
