import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../utils/http-error';
import type { CreateTaskInput, ListTasksQuery, Task, UpdateTaskInput } from './tasks.schema';

export interface PaginatedTasks {
  readonly data: Task[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

// In-memory store standing in for a database. Swap this layer for a real
// repository without touching the controller or routes.
const store = new Map<string, Task>();

const insertSeed = (title: string, completed: boolean): void => {
  const now = new Date().toISOString();
  const id = randomUUID();
  store.set(id, { id, title, completed, createdAt: now, updatedAt: now });
};

insertSeed('Set up the server', true);
insertSeed('Write a production API route', false);

const findOrThrow = (id: string): Task => {
  const task = store.get(id);
  if (!task) throw new NotFoundError(`Task ${id} not found`);
  return task;
};

export const tasksService = {
  async list(query: ListTasksQuery): Promise<PaginatedTasks> {
    let items = [...store.values()];

    if (query.completed !== undefined) {
      items = items.filter((task) => task.completed === query.completed);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter((task) => task.title.toLowerCase().includes(term));
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = items.length;
    const offset = (query.page - 1) * query.limit;
    const data = items.slice(offset, offset + query.limit);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async get(id: string): Promise<Task> {
    return findOrThrow(id);
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      completed: input.completed,
      createdAt: now,
      updatedAt: now,
    };
    store.set(task.id, task);
    return task;
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = findOrThrow(id);
    const updated: Task = { ...existing, ...input, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  async remove(id: string): Promise<void> {
    findOrThrow(id);
    store.delete(id);
  },
};
