import express from "express";
import { configDotenv } from "dotenv";
import authRouter from "./routes/auth.router";
import { devRouter } from "./routes/dev.router";
import { errorHandler } from "./middleware/errorHandler";

configDotenv();
const app = express();
const port: number = Number(process.env.PORT) || 8001;
const apiVersion: number = Number(process.env.API_VERSION) || 1;

app.use(express.json());

app.use(`/api/v${apiVersion}/auth`, authRouter);
app.use(`/api/v${apiVersion}/dev`, devRouter);

app.get(`/api/v${apiVersion}/user/`, (_req, res) => {
  res.json({"Hello": "World"});
});


app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
