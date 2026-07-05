import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createSession, getSession, listSessions } from './sessions.controller';
import { createSessionSchema, sessionParamsSchema } from './sessions.schema';

export const sessionsRouter = Router();

sessionsRouter.get('/', listSessions);
sessionsRouter.get('/:id', validate({ params: sessionParamsSchema }), getSession);
sessionsRouter.post('/', validate({ body: createSessionSchema }), createSession);
