import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { requestContext } from './middleware/requestContext';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

/**
 * Resolves the browser origins allowed to call this API.
 *
 * CLIENT_URL accepts a comma separated list so Netlify preview deploys can be
 * allowed alongside the production site. Splitting happens here rather than
 * relying on the raw string: passing "https://a,https://b" through as a single
 * array entry would match no real origin and silently block every request.
 */
export const resolveAllowedOrigins = (
  clientUrls: string[],
  isProduction: boolean,
): string[] =>
  isProduction
    ? clientUrls
    : [...clientUrls, 'http://localhost:5173', 'http://localhost:3000'];

export const createApp = (): express.Application => {
  const app = express();

  // Basic security and performance middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: resolveAllowedOrigins(env.clientUrls, env.isProduction),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['Content-Disposition', 'X-Request-Id'],
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Tracing / correlation id
  app.use(requestContext);

  // Serve static uploads
  app.use('/uploads', express.static(env.uploadDirAbsolute));

  // Health check endpoint (exempt from rate limit)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'hps-oms-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Apply rate limiter to API routes
  app.use(env.API_PREFIX, apiLimiter, apiRouter);

  // Catch 404 and forward to error handler
  app.use(notFoundHandler);

  // Central error handling
  app.use(errorHandler);

  return app;
};

export const app = createApp();
