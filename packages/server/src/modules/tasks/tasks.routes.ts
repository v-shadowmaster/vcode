import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createTask, deleteTask, getTask, listTasks, updateTask } from './tasks.controller';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
} from './tasks.schema';

export const tasksRouter = Router();

tasksRouter.get('/', validate({ query: listTasksQuerySchema }), listTasks);
tasksRouter.post('/', validate({ body: createTaskSchema }), createTask);
tasksRouter.get('/:id', validate({ params: taskParamsSchema }), getTask);
tasksRouter.patch(
  '/:id',
  validate({ params: taskParamsSchema, body: updateTaskSchema }),
  updateTask,
);
tasksRouter.delete('/:id', validate({ params: taskParamsSchema }), deleteTask);
