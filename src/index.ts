import { configDotenv } from "dotenv";
configDotenv();

import { createApp } from "./config/app";

const main = () => {
  const app = createApp();
  const port = Number(process.env.PORT) || 8001;
  
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/health`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Start the server
main();
