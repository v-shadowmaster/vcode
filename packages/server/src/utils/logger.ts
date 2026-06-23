import path from 'node:path';
import { mkdirSync } from 'node:fs';
import util from 'node:util';
import winston from 'winston';
import chalk from 'chalk';
import { config, SERVICE_NAME } from '../config/env';

const { combine, timestamp, errors, json, printf } = winston.format;

const LEVEL_COLOR: Record<string, (text: string) => string> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.cyan,
  http: chalk.magenta,
  verbose: chalk.blue,
  debug: chalk.gray,
  silly: chalk.gray,
};

const RESERVED_KEYS = new Set(['level', 'message', 'timestamp', 'stack', 'service']);

const formatMeta = (info: winston.Logform.TransformableInfo): string => {
  const meta: Record<string, unknown> = {};
  for (const key of Object.keys(info)) {
    if (!RESERVED_KEYS.has(key)) meta[key] = (info as Record<string, unknown>)[key];
  }
  if (Object.keys(meta).length === 0) return '';
  return ` ${util.inspect(meta, { colors: true, depth: 4, compact: true, breakLength: 120 })}`;
};

const prettyConsoleFormat = combine(
  timestamp({ format: 'HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf((info) => {
    const colorize = LEVEL_COLOR[info.level] ?? chalk.white;
    const label = colorize(info.level.toUpperCase().padEnd(5));
    const time = chalk.gray(String(info.timestamp));
    const stack = typeof info.stack === 'string' ? `\n${chalk.gray(info.stack)}` : '';
    return `${time} ${label} ${String(info.message)}${formatMeta(info)}${stack}`;
  }),
);

const structuredFormat = combine(timestamp(), errors({ stack: true }), json());

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.IS_PRODUCTION ? structuredFormat : prettyConsoleFormat,
  }),
];

if (config.LOG_TO_FILE) {
  const logsDir = path.resolve(config.LOG_FOLDER_PATH);
  mkdirSync(logsDir, { recursive: true });
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.jsonl'),
      level: 'error',
      format: structuredFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.jsonl'),
      format: structuredFormat,
    }),
  );
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  defaultMeta: { service: SERVICE_NAME },
  transports,
});

/**
 * Logs an error with a consistent shape. Stack traces are omitted in production
 * to avoid leaking internal paths if logs reach a shared destination.
 */
export const logError = (message: string, error: unknown, meta: Record<string, unknown> = {}): void => {
  const detail =
    error instanceof Error
      ? { error: error.message, ...(config.IS_PRODUCTION ? {} : { stack: error.stack }) }
      : { error: String(error) };
  logger.error(message, { ...meta, ...detail });
};
