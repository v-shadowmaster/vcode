import type { Request, Response } from 'express';
import { sessionsService } from './sessions.service';
import type { CreateSessionInput, SessionParams } from './sessions.schema';

export const listSessions = async (_req: Request, res: Response): Promise<void> => {
  res.json({ data: await sessionsService.list() });
};

export const getSession = async (req: Request<SessionParams>, res: Response): Promise<void> => {
  const session = await sessionsService.get(req.params.id);
  res.json({ data: session });
};

export const createSession = async (
  req: Request<unknown, unknown, CreateSessionInput>,
  res: Response,
): Promise<void> => {
  const session = await sessionsService.create(req.body);
  res.status(201).json({ data: session });
};
