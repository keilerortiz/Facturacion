import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '../config/env.js';
import { requestId } from '../middleware/requestId.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { apiRateLimiter } from '../middleware/rateLimiters.js';
import { apiRouter } from '../routes/index.js';
import { healthRouter } from '../routes/healthRoutes.js';
import { notFoundHandler } from '../middleware/notFoundHandler.js';
import { errorHandler } from '../middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // --- Observabilidad: requestId primero (todo depende de él) ---
  app.use(requestId);

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(compression());

  // --- Logging: estructurado en producción, morgan en dev ---
  app.use(requestLogger);
  if (env.nodeEnv !== 'production') {
    app.use(morgan('dev'));
  }

  app.use(express.json());

  // --- Health checks (sin auth, sin rate limit) ---
  app.use('/health', healthRouter);

  app.use('/api', apiRateLimiter, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
