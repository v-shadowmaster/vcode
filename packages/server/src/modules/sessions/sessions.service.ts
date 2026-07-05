import { randomUUID } from 'node:crypto';
import { DEFAULT_CHAT_MODEL_ID } from '@vcode/shared';
import { NotFoundError } from '../../utils/http-error';
import { messageStatusSchema } from './sessions.schema';
import type { CreateSessionInput, Message, Session, SessionSummary } from './sessions.schema';

const MOCK_USER_ID = 'mock-user';

const store = new Map<string, Session>();

const buildSession = (input: CreateSessionInput): Session => {
  const { initialMessage, title, cwd } = input;
  const now = new Date().toISOString();
  const id = randomUUID();

  const messages: Message[] = initialMessage
    ? [
      {
        id: randomUUID(),
        sessionId: id,
        ...initialMessage,
        status: messageStatusSchema.enum.complete,
        parts: null,
        duration: null,
        createdAt: now,
      },
    ]
    : [];

  return { id, title, cwd: cwd ?? null, userId: MOCK_USER_ID, createdAt: now, messages };
};

// Seed one session so the list and detail routes return data on a fresh boot.
const seed = (input: CreateSessionInput): void => {
  const session = buildSession(input);
  store.set(session.id, session);
};

seed({
  title: 'Explore the vcode server',
  cwd: '/workspace/vcode',
  initialMessage: {
    role: 'user',
    content: 'How does the server boot?',
    mode: 'ask',
    model: DEFAULT_CHAT_MODEL_ID,
  },
});

const findOrThrow = (id: string): Session => {
  const session = store.get(id);
  if (!session) throw new NotFoundError(`Session ${id} not found`);
  return session;
};

export const sessionsService = {
  async list(): Promise<SessionSummary[]> {
    return [...store.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ id, title, createdAt }) => ({ id, title, createdAt }));
  },

  async get(id: string): Promise<Session> {
    const session = findOrThrow(id);
    return {
      ...session,
      messages: [...session.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  },

  async create(input: CreateSessionInput): Promise<Session> {
    const session = buildSession(input);
    store.set(session.id, session);
    return session;
  },
};
