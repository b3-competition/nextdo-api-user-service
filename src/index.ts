import { configDotenv } from "dotenv";
configDotenv();

import { createApp } from "./config/app";
import { logger } from "./config/logger";

const main = () => {
  const app = createApp();
  const port = Number(process.env.PORT) || 8001;

  app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    logger.info(`API Documentation: http://localhost:${port}/health`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

// Start the server
main();
