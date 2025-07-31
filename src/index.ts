import express from "express";
import { configDotenv } from "dotenv";

configDotenv();
const app = express();
const port: number = Number(process.env.PORT) || 8001;
const apiVersion: number = Number(process.env.API_VERSION) || 1;

app.get(`/api/v${apiVersion}/user/`, (req, res) => {
  res.json({ Hello: "World" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
