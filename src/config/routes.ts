import { Application } from 'express';
import authRouter from '../routes/auth.router';
import { devRouter } from '../routes/dev.router';
import { authLimiter } from '../middleware/security';
import { CognitoService, cognitoConfig } from '../modules/auth';

export const setupRoutes = (app: Application, apiVersion: number) => {
  const cognitoService = new CognitoService(cognitoConfig);

  // Authentication routes with rate limiting
  app.use(`/api/v${apiVersion}/auth`, authLimiter, authRouter);
  
  // Development/testing routes
  app.use(`/api/v${apiVersion}/dev`, devRouter);
  
  // Protected route example
  app.get(`/api/v${apiVersion}/protected`, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authorization token is required"
        });
      }

      const result = await cognitoService.verifyToken(token);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "This is a protected endpoint",
          user: result.payload
        });
      } else {
        res.status(401).json(result);
      }
    } catch {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  
  // Basic test endpoint
  app.get(`/api/v${apiVersion}/user/`, (_req, res) => {
    res.json({ "Hello": "World" });
  });
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1',
      environment: process.env.NODE_ENV || 'development'
    });
  });
};