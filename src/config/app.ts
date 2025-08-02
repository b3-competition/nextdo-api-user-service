import express, { Application } from 'express';
import { corsConfig, helmetConfig, generalLimiter } from '../middleware/security';
import { errorHandler } from '../middleware/errorHandler';
import { setupRoutes } from './routes';

export const createApp = (): Application => {
  const app = express();
  const apiVersion = Number(process.env.API_VERSION) || 1;

  // Security middleware
  app.use(helmetConfig);
  app.use(generalLimiter);
  app.use(corsConfig);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // JSON parsing error handler
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({
        success: false,
        error: 'InvalidJSON',
        message: 'Invalid JSON format in request body'
      });
    }
    next(error);
  });

  // Setup routes
  setupRoutes(app, apiVersion);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};