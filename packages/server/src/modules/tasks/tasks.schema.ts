import { z } from 'zod';

export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  completed: z.boolean().default(false),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    completed: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const taskParamsSchema = z.object({
  id: z.uuid(),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  completed: z.stringbool().optional(),
  search: z.string().trim().min(1).optional(),
});

export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
