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
import { createHmac } from "crypto";
import {
  CognitoConfig,
  SignUpRequest,
  LoginRequest,
  ConfirmSignUpRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
  RefreshTokenRequest,
  AuthResponse,
} from "./models";
import { ConfigurationError } from "./errors";
import { CognitoClientFactory } from "./config";

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;
  private jwtVerifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = CognitoClientFactory.createClient(config);
    this.jwtVerifier = CognitoClientFactory.createJwtVerifier(config);
  }

  private generateSecretHash(username: string): string | undefined {
    if (!this.config.clientSecret) {
      return undefined;
    }
    
    const message = username + this.config.clientId;
    const hmac = createHmac('sha256', this.config.clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
  }

  async signUp(request: SignUpRequest): Promise<AuthResponse> {
    try {
      const secretHash = this.generateSecretHash(request.email);
      const command = new SignUpCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        Password: request.password,
        ...(secretHash && { SecretHash: secretHash }),
        UserAttributes: [
          { Name: "email", Value: request.email },
          { Name: "name", Value: request.fullName },
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
      const secretHash = this.generateSecretHash(request.email);
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
        ...(secretHash && { SecretHash: secretHash }),
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
      const secretHash = this.generateSecretHash(request.email);
      const authParameters: Record<string, string> = {
        USERNAME: request.email,
        PASSWORD: request.password,
      };
      
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
      }
      
      const command = new InitiateAuthCommand({
        ClientId: this.config.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: authParameters,
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
      const secretHash = this.generateSecretHash(request.email);
      const command = new ForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        ...(secretHash && { SecretHash: secretHash }),
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
      const secretHash = this.generateSecretHash(request.email);
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: request.email,
        ConfirmationCode: request.confirmationCode,
        Password: request.newPassword,
        ...(secretHash && { SecretHash: secretHash }),
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
      const secretHash = this.generateSecretHash(email);
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.config.clientId,
        Username: email,
        ...(secretHash && { SecretHash: secretHash }),
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

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.config.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: request.refreshToken,
        },
      });

      const response = await this.client.send(command);
      
      if (response.AuthenticationResult) {
        return {
          success: true,
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken ?? request.refreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn,
          message: "Tokens refreshed successfully",
        };
      } else {
        return {
          success: false,
          error: "RefreshFailed",
          message: "Failed to refresh tokens",
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Failed to refresh token',
      };
    }
  }
}