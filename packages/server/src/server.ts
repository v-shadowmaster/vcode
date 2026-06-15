import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from './utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the root directory (parent of backend)
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Fallback to default behavior (looks in current working directory)
    dotenv.config();
}

export async function createApp() {
    const app = express();
    app.set('trust proxy', 1);

    app.use(
        cors({
            origin: true, // Allow all origins (matches Better Auth's trustedOrigins: ['*'])
            credentials: true, // Allow cookies/credentials
            exposedHeaders: ['Content-Range', 'Preference-Applied'],
        })
    );

    app.use(cookieParser());

    app.use((req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();
        const originalSend = res.send;
        const originalJson = res.json;

        // Track response size
        let responseSize = 0;

        // Override send method
        res.send = function (
            data: string | Buffer | Record<string, unknown> | unknown[] | number | boolean
        ) {
            if (data !== undefined && data !== null) {
                if (typeof data === 'string') {
                    responseSize = Buffer.byteLength(data);
                } else if (Buffer.isBuffer(data)) {
                    responseSize = data.length;
                } else if (typeof data === 'number' || typeof data === 'boolean') {
                    responseSize = Buffer.byteLength(String(data));
                } else {
                    try {
                        responseSize = Buffer.byteLength(JSON.stringify(data));
                    } catch {
                        // Handle circular references or unstringifiable objects
                        responseSize = 0;
                    }
                }
            }
            return originalSend.call(this, data);
        };

        // Override json method
        res.json = function (
            data: Record<string, unknown> | unknown[] | string | number | boolean | null
        ) {
            if (data !== undefined) {
                try {
                    responseSize = Buffer.byteLength(JSON.stringify(data));
                } catch {
                    // Handle circular references or unstringifiable objects
                    responseSize = 0;
                }
            }
            return originalJson.call(this, data);
        };

        // Log after response is finished
        res.on('finish', () => {
            // Skip logging for logs endpoints to avoid infinite loops
            if (req.path.includes('/logs/')) {
                return;
            }

            const duration = Date.now() - startTime;
            logger.info('HTTP Request', {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                size: responseSize,
                duration: `${duration}ms`,
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
                timestamp: new Date().toISOString(),
            });
        });

        next();
    });

    // Create API router and mount all API routes under /api
    const apiRouter = express.Router();

    apiRouter.get('/health', (_req: Request, res: Response) => {
        const version = process.env["VERSION"];
        res.json({
            status: 'ok',
            version,
            service: 'VCODE OSS Backend',
            timestamp: new Date().toISOString(),
        });
    });

    // Mount all API routes under /api prefix
    app.use('/api', apiRouter);

    return app;
}

// Use PORT from config (already parsed from env, falls back to 7130)
const PORT = process.env["PORT"] || 3000;

async function initializeServer() {
    try {
        const app = await createApp();
        const server = app.listen(PORT, () => {
            logger.info(`Backend API service listening on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to initialize server', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}

void initializeServer();

async function cleanup() {
    logger.info('Shutting down gracefully...');

    process.exit(0);
}

process.on('SIGINT', () => void cleanup());
process.on('SIGTERM', () => void cleanup());