import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './routes';

/** Builds the Express application with middleware and routes wired up. */
export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());

  if (config.IS_PRODUCTION && !Array.isArray(config.CORS_ORIGIN)) {
    logger.warn('CORS_ORIGIN is unset; reflecting all origins without credentials. Set a comma-separated allowlist for production.');
  }
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: config.IS_PRODUCTION ? Array.isArray(config.CORS_ORIGIN) : true,
      exposedHeaders: ['Content-Range', 'Preference-Applied'],
    }),
  );
  app.use(express.json({ limit: config.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: config.BODY_LIMIT }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
