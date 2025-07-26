import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;
  private jwtVerifier: any;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({ region: config.region });
    this.jwtVerifier = CognitoJwtVerifier.create({
      userPoolId: config.userPoolId,
      tokenUse: "access",
      clientId: config.clientId,
    });
  }

  async signUp(request: SignUpRequest) {
    try {
      const command = new SignUpCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        Password: request.password,
        UserAttributes: [
          { Name: "email", Value: request.email },
          ...(request.firstName ? [{ Name: "given_name", Value: request.firstName }] : []),
          ...(request.lastName ? [{ Name: "family_name", Value: request.lastName }] : []),
        ],
      });

      const response = await this.client.send(command);
      return {
        success: true,
        userSub: response.UserSub,
        message: "User registered successfully. Please check your email for confirmation code.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  async confirmSignUp(request: ConfirmSignUpRequest) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
      });

      await this.client.send(command);
      return {
        success: true,
        message: "Email confirmed successfully. You can now log in.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  async login(request: LoginRequest) {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.config.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: request.email,
          PASSWORD: request.password,
        },
      });

      const response = await this.client.send(command);
      
      if (response.AuthenticationResult) {
        return {
          success: true,
          accessToken: response.AuthenticationResult.AccessToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
          idToken: response.AuthenticationResult.IdToken,
          expiresIn: response.AuthenticationResult.ExpiresIn,
          message: "Login successful",
        };
      } else {
        return {
          success: false,
          error: "AuthenticationFailed",
          message: "Authentication failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  async forgotPassword(request: ForgotPasswordRequest) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: request.email,
      });

      await this.client.send(command);
      return {
        success: true,
        message: "Password reset code sent to your email.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  async confirmForgotPassword(request: ConfirmForgotPasswordRequest) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
        Password: request.newPassword,
      });

      await this.client.send(command);
      return {
        success: true,
        message: "Password reset successfully. You can now log in with your new password.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.config.clientId,
        Username: email,
      });

      await this.client.send(command);
      return {
        success: true,
        message: "Confirmation code resent to your email.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtVerifier.verify(token);
      return {
        success: true,
        payload,
        message: "Token is valid",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name,
        message: "Invalid or expired token",
      };
    }
  }
}