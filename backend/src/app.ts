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
      origin: env.isProduction ? [env.CLIENT_URL] : [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
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
