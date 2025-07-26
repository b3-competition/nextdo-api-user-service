import express from "express";
import { configDotenv } from "dotenv";
import { CognitoService, CognitoConfig } from "./services/cognitoService";

configDotenv();
const app = express();
const port: number = Number(process.env.PORT) || 8001;
const apiVersion: number = Number(process.env.API_VERSION) || 1;

app.use(express.json());

const cognitoConfig: CognitoConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  userPoolId: process.env.COGNITO_USER_POOL_ID || "",
  clientId: process.env.COGNITO_CLIENT_ID || "",
};

const cognitoService = new CognitoService(cognitoConfig);

app.get(`/api/v${apiVersion}/user/`, (_req, res) => {
  res.json({"Hello": "World"});
});

app.post(`/api/v${apiVersion}/auth/signup`, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const result = await cognitoService.signUp({
      email,
      password,
      firstName,
      lastName
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.post(`/api/v${apiVersion}/auth/confirm-signup`, async (req, res) => {
  try {
    const { email, confirmationCode } = req.body;
    
    if (!email || !confirmationCode) {
      return res.status(400).json({
        success: false,
        message: "Email and confirmation code are required"
      });
    }

    const result = await cognitoService.confirmSignUp({
      email,
      confirmationCode
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.post(`/api/v${apiVersion}/auth/login`, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const result = await cognitoService.login({
      email,
      password
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.post(`/api/v${apiVersion}/auth/forgot-password`, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const result = await cognitoService.forgotPassword({ email });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.post(`/api/v${apiVersion}/auth/confirm-forgot-password`, async (req, res) => {
  try {
    const { email, confirmationCode, newPassword } = req.body;
    
    if (!email || !confirmationCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, confirmation code, and new password are required"
      });
    }

    const result = await cognitoService.confirmForgotPassword({
      email,
      confirmationCode,
      newPassword
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.post(`/api/v${apiVersion}/auth/resend-confirmation`, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const result = await cognitoService.resendConfirmationCode(email);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.get(`/api/v${apiVersion}/auth/verify-token`, async (req, res) => {
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
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
