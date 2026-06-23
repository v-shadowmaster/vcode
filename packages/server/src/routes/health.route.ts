import { Router, type Request, type Response } from 'express';
import { config, SERVICE_NAME } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: SERVICE_NAME,
    version: config.VERSION,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
