import { z } from 'zod';
import { findSupportedChatModel } from '@vcode/shared';

// Domain enums a database layer would normally generate. Kept here so the rest
// of the module stays type-safe until a real schema replaces them.
export const roleSchema = z.enum(['user', 'assistant', 'system']);
export const modeSchema = z.enum(['ask', 'agent']);
export const messageStatusSchema = z.enum(['pending', 'streaming', 'complete', 'error']);

export const messageSchema = z.object({
  id: z.uuid(),
  sessionId: z.uuid(),
  role: roleSchema,
  content: z.string(),
  mode: modeSchema,
  model: z.string(),
  status: messageStatusSchema,
  // Streaming parts are not modelled in the mock; always null for now.
  parts: z.null(),
  duration: z.number().nullable(),
  createdAt: z.string(),
});

export const sessionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  cwd: z.string().nullable(),
  userId: z.string(),
  createdAt: z.string(),
  messages: z.array(messageSchema),
});

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  cwd: z.string().optional(),
  initialMessage: z
    .object({
      role: roleSchema,
      content: z.string().min(1),
      mode: modeSchema,
      model: z.string().refine((id) => !!findSupportedChatModel(id), 'Unsupported model'),
    })
    .optional(),
});

export const sessionParamsSchema = z.object({
  id: z.uuid(),
});

export type Role = z.infer<typeof roleSchema>;
export type Mode = z.infer<typeof modeSchema>;
export type MessageStatus = z.infer<typeof messageStatusSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SessionParams = z.infer<typeof sessionParamsSchema>;

// GET /sessions returns a lightweight summary rather than full sessions.
export type SessionSummary = Pick<Session, 'id' | 'title' | 'createdAt'>;
export type InitialMessageInput = NonNullable<CreateSessionInput['initialMessage']>;
