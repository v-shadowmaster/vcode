import { STATUS_CODES } from 'node:http';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { logError } from '../utils/logger';
import { BadRequestError } from '../utils/http-error';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  details?: unknown;
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: { status: 404, message: `Cannot ${req.method} ${req.originalUrl}` },
  });
};

export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const normalized: HttpError =
    err instanceof ZodError
      ? new BadRequestError(
          'Validation failed',
          err.issues.map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message })),
        )
      : err;

  const status = normalized.status ?? normalized.statusCode ?? 500;
  const expose = normalized.expose === true;

  logError(`${req.method} ${req.originalUrl} failed`, err, { status });

  if (res.headersSent) {
    next(err);
    return;
  }

  const message = config.IS_PRODUCTION && !expose ? (STATUS_CODES[status] ?? 'Error') : normalized.message;
  const details = normalized.details;
  res.status(status).json({ error: { status, message, ...(details ? { details } : {}) } });
};
