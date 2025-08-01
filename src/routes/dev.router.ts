import { Router } from "express";
import { CognitoService, cognitoConfig } from "../modules/auth";

const router: Router = Router();
const cognitoService = new CognitoService(cognitoConfig);

export const devRouter = router;

router.get("/protected", async (req, res, next) => {
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
    next(error);
  }
});