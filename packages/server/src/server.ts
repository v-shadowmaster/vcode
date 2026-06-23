import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import { config } from './config/env';
import { logger, logError } from './utils/logger';
import { printStartupBanner } from './utils/banner';
import { createApp } from './app';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

const resolveDisplayHost = (host: string): string =>
  host === '0.0.0.0' || host === '::' ? 'localhost' : host;

const listen = (server: http.Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.PORT, config.HOST, () => {
      server.off('error', reject);
      resolve();
    });
  });

const startServer = async (): Promise<void> => {
  const startedAt = performance.now();
  const server = http.createServer(createApp());

  const sockets = new Set<Socket>();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });

  await listen(server);
  server.on('error', (error) => logError('Server error', error));

  const { port } = server.address() as AddressInfo;
  const url = `http://${resolveDisplayHost(config.HOST)}:${port}`;

  printStartupBanner({
    url,
    healthUrl: `${url}/api/health`,
    startupMs: Math.round(performance.now() - startedAt),
  });

  let shuttingDown = false;
  let finalExitCode = 0;
  const shutdown = (reason: string, exitCode = 0): void => {
    if (exitCode) finalExitCode = exitCode; // escalate before the idempotency guard
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${reason}, shutting down gracefully`);

    const forceExit = setTimeout(() => {
      logError('Graceful shutdown timed out, forcing exit', new Error('shutdown timeout'));
      sockets.forEach((socket) => socket.destroy());
      process.exit(1);
    }, config.SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close((error) => {
      clearTimeout(forceExit);
      if (error) {
        logError('Error while closing server', error);
        process.exit(1);
        return;
      }
      logger.info('Server closed, goodbye');
      process.exit(finalExitCode);
    });
  };

  // A crash leaves the process in an undefined state: stop serving traffic
  // immediately instead of draining in-flight requests.
  const crash = (reason: string, error: unknown): void => {
    logError(reason, error);
    sockets.forEach((socket) => socket.destroy());
    shutdown(reason, 1);
  };

  SHUTDOWN_SIGNALS.forEach((signal) => process.on(signal, () => shutdown(signal)));
  process.on('uncaughtException', (error) => crash('Uncaught exception', error));
  process.on('unhandledRejection', (reason) => crash('Unhandled promise rejection', reason));
};

void startServer().catch((error) => {
  logError('Failed to start server', error);
  process.exit(1);
});
