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
  private jwtVerifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({ region: config.region });
    
    if (!config.userPoolId || !config.clientId) {
      console.warn('⚠️  AWS Cognito configuration is incomplete. Authentication endpoints will not work properly.');
      this.jwtVerifier = null as any;
    } else {
      this.jwtVerifier = CognitoJwtVerifier.create({
        userPoolId: config.userPoolId,
        tokenUse: "access",
        clientId: config.clientId,
      });
    }
  }

  async signUp(request: SignUpRequest) {
    if (!this.config.userPoolId || !this.config.clientId) {
      return {
        success: false,
        error: 'ConfigurationError',
        message: 'AWS Cognito configuration is incomplete. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables.',
      };
    }
    
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
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async confirmSignUp(request: ConfirmSignUpRequest) {
    if (!this.config.userPoolId || !this.config.clientId) {
      return {
        success: false,
        error: 'ConfigurationError',
        message: 'AWS Cognito configuration is incomplete. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables.',
      };
    }
    
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
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async login(request: LoginRequest) {
    if (!this.config.userPoolId || !this.config.clientId) {
      return {
        success: false,
        error: 'ConfigurationError',
        message: 'AWS Cognito configuration is incomplete. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables.',
      };
    }
    
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
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
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
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
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
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
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
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async verifyToken(token: string) {
    if (!this.jwtVerifier) {
      return {
        success: false,
        error: 'ConfigurationError',
        message: 'AWS Cognito configuration is incomplete',
      };
    }
    
    try {
      const payload = await this.jwtVerifier.verify(token);
      return {
        success: true,
        payload,
        message: "Token is valid",
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'TokenVerificationError',
        message: "Invalid or expired token",
      };
    }
  }
}