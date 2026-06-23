import { Router } from 'express';
import { tasksRouter } from '../modules/tasks/tasks.routes';
import { healthRouter } from './health.route';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/tasks', tasksRouter);
