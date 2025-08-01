import { Router } from "express";
import { CognitoService, cognitoConfig } from "../modules/auth";

const router: Router = Router();
const cognitoService = new CognitoService(cognitoConfig);

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, fullName, age, educationLevel, currentRole, portfolio } = req.body;
    
    if (!email || !password || !fullName || !age || !educationLevel || !currentRole) {
      return res.status(400).json({
        success: false,
        message: "Email, password, full name, age, education level, and current role are required"
      });
    }

    const result = await cognitoService.signUp({
      email,
      password,
      fullName,
      age,
      educationLevel,
      currentRole,
      portfolio
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/confirm-signup", async (req, res, next) => {
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
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
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
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
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
    next(error);
  }
});

router.post("/confirm-forgot-password", async (req, res, next) => {
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
    next(error);
  }
});

router.post("/resend-confirmation", async (req, res, next) => {
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
    next(error);
  }
});

router.get("/verify-token", async (req, res, next) => {
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
    next(error);
  }
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    const result = await cognitoService.refreshToken({ refreshToken });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    next(error);
  }
});

export default router;