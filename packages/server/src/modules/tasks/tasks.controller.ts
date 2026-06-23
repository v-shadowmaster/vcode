import type { Request, Response } from 'express';
import { tasksService } from './tasks.service';
import type { CreateTaskInput, ListTasksQuery, TaskParams, UpdateTaskInput } from './tasks.schema';

export const listTasks = async (req: Request, res: Response): Promise<void> => {
  // Coerced by validate(); Express still types req.query as string values.
  const query = req.query as unknown as ListTasksQuery;
  res.json(await tasksService.list(query));
};

export const getTask = async (req: Request<TaskParams>, res: Response): Promise<void> => {
  const task = await tasksService.get(req.params.id);
  res.json({ data: task });
};

export const createTask = async (
  req: Request<unknown, unknown, CreateTaskInput>,
  res: Response,
): Promise<void> => {
  const task = await tasksService.create(req.body);
  res.status(201).json({ data: task });
};

export const updateTask = async (
  req: Request<TaskParams, unknown, UpdateTaskInput>,
  res: Response,
): Promise<void> => {
  const task = await tasksService.update(req.params.id, req.body);
  res.json({ data: task });
};

export const deleteTask = async (req: Request<TaskParams>, res: Response): Promise<void> => {
  await tasksService.remove(req.params.id);
  res.status(204).send();
};
