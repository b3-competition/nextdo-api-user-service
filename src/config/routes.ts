import { Application } from "express";
import authRouter from "../routes/auth.router";
import { devRouter } from "../routes/dev.router";

export const setupRoutes = (app: Application, apiVersion: number) => {
  // Authentication routes with rate limiting
  app.use(`/api/v${apiVersion}/auth`, authRouter);

  // Development/testing routes
  app.use(`/api/v${apiVersion}/dev`, devRouter);

  // Basic test endpoint
  app.get(`/api/v${apiVersion}/user/`, (_req, res) => {
    res.json({ Hello: "World" });
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "1",
      environment: process.env.NODE_ENV || "development",
    });
  });
};
