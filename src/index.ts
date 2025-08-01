import express from "express";
import { configDotenv } from "dotenv";
import { CognitoService, cognitoConfig } from "./modules/auth";
import authRouter from "./routes/auth.router";

configDotenv();
const app = express();
const port: number = Number(process.env.PORT) || 8001;
const apiVersion: number = Number(process.env.API_VERSION) || 1;

app.use(express.json());

const cognitoService = new CognitoService(cognitoConfig);

app.use(`/api/v${apiVersion}/auth`, authRouter);

app.get(`/api/v${apiVersion}/user/`, (_req, res) => {
  res.json({"Hello": "World"});
});

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
      res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  } catch {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
