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
import {
  CognitoConfig,
  SignUpRequest,
  LoginRequest,
  ConfirmSignUpRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
  AuthResponse,
} from "./models";
import { ConfigurationError } from "./errors";
import { PasswordService } from "./password.service";
import { CognitoClientFactory } from "./config";

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;
  private jwtVerifier: ReturnType<typeof CognitoJwtVerifier.create>;
  private passwordService: PasswordService;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = CognitoClientFactory.createClient(config);
    this.passwordService = new PasswordService();
    this.jwtVerifier = CognitoClientFactory.createJwtVerifier(config);
  }

  async signUp(request: SignUpRequest): Promise<AuthResponse> {
    try {
      const hashedPassword = await this.passwordService.hashPassword(request.password);
      
      const command = new SignUpCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        Password: hashedPassword,
        UserAttributes: [
          { Name: "email", Value: request.email },
          { Name: "name", Value: request.fullName },
          { Name: "custom:age", Value: request.age.toString() },
          { Name: "custom:education_level", Value: request.educationLevel },
          { Name: "custom:current_role", Value: request.currentRole },
          ...(request.portfolio ? [{ Name: "custom:portfolio", Value: request.portfolio }] : []),
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

  async confirmSignUp(request: ConfirmSignUpRequest): Promise<AuthResponse> {
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

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const hashedPassword = await this.passwordService.hashPassword(request.password);
      
      const command = new InitiateAuthCommand({
        ClientId: this.config.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: request.email,
          PASSWORD: hashedPassword,
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

  async forgotPassword(request: ForgotPasswordRequest): Promise<AuthResponse> {
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

  async confirmForgotPassword(request: ConfirmForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const hashedNewPassword = await this.passwordService.hashPassword(request.newPassword);
      
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
        Password: hashedNewPassword,
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

  async resendConfirmationCode(email: string): Promise<AuthResponse> {
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

  async verifyToken(token: string): Promise<AuthResponse> {
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