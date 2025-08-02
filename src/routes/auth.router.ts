import { Router } from "express";
import { CognitoService, cognitoConfig } from "../modules/auth";
import { 
  validateZodRequest,
  signupSchema,
  loginSchema,
  confirmSignupSchema,
  forgotPasswordSchema,
  confirmForgotPasswordSchema,
  refreshTokenSchema,
  validateSignupStep
} from "../middleware/zodValidation";

const router: Router = Router();
const cognitoService = new CognitoService(cognitoConfig);

router.post("/signup", validateZodRequest(signupSchema), async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      fullName, 
      age, 
      educationLevel, 
      currentRole, 
      portfolio,
      aiPreferences,
      acceptedTerms,
      acceptedPrivacy,
      marketingConsent
    } = req.body;

    const result = await cognitoService.signUp({
      email,
      password,
      fullName,
      age, 
      educationLevel,
      currentRole,
      portfolio: portfolio || undefined,
      aiPreferences,
      acceptedTerms,
      acceptedPrivacy,
      marketingConsent
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        userSub: result.userSub,
        message: "User registered successfully. Please check your email for confirmation code."
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/confirm-signup", validateZodRequest(confirmSignupSchema), async (req, res, next) => {
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

router.post("/login", validateZodRequest(loginSchema), async (req, res, next) => {
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

router.post("/forgot-password", validateZodRequest(forgotPasswordSchema), async (req, res, next) => {
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

router.post("/confirm-forgot-password", validateZodRequest(confirmForgotPasswordSchema), async (req, res, next) => {
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

router.post("/resend-confirmation", validateZodRequest(forgotPasswordSchema), async (req, res, next) => {
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

router.post("/refresh-token", validateZodRequest(refreshTokenSchema), async (req, res, next) => {
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

// Step-by-step validation endpoints for crispy UX
router.post("/validate-step/personal", validateSignupStep('personal'), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Personal info is valid ✨",
    step: "personal"
  });
});

router.post("/validate-step/ai", validateSignupStep('ai'), (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI preferences are valid 🤖", 
    step: "ai"
  });
});

router.post("/validate-step/identity", validateSignupStep('identity'), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Identity info is valid 🔐",
    step: "identity"
  });
});

router.post("/validate-step/terms", validateSignupStep('terms'), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Terms acceptance is valid ✅",
    step: "terms"
  });
});

export default router;