import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

export const SERVICE_NAME = 'VCODE Server';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = path.join(PACKAGE_ROOT, '.env');

dotenv.config({ quiet: true, ...(existsSync(envFile) ? { path: envFile } : {}) });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  VERSION: z.string().default('0.0.0'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).optional(),
  LOG_FOLDER_PATH: z.string().default('./logs'),
  LOG_TO_FILE: z.stringbool().optional(),
  CORS_ORIGIN: z.string().optional(),
  BODY_LIMIT: z.string().default('1mb'),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => [key, value === '' ? undefined : value]),
);
const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const env = parsed.data;
const IS_PRODUCTION = env.NODE_ENV === 'production';

const parseCorsOrigin = (value: string | undefined): string[] | boolean => {
  if (!value || value === '*') return true;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

/** Validated, immutable runtime configuration derived from the environment. */
export const config = Object.freeze({
  ...env,
  LOG_LEVEL: env.LOG_LEVEL ?? (IS_PRODUCTION ? 'info' : 'debug'),
  LOG_TO_FILE: env.LOG_TO_FILE ?? IS_PRODUCTION,
  CORS_ORIGIN: parseCorsOrigin(env.CORS_ORIGIN),
  IS_PRODUCTION,
  IS_DEVELOPMENT: env.NODE_ENV === 'development',
  IS_TEST: env.NODE_ENV === 'test',
});

export type Config = typeof config;
