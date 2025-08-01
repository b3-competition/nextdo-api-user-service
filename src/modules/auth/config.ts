import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoConfig } from "./models";
import { ConfigurationError } from "./errors";

export const cognitoConfig: CognitoConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  userPoolId: process.env.COGNITO_USER_POOL_ID || "",
  clientId: process.env.COGNITO_CLIENT_ID || "",
};

export class CognitoClientFactory {
  static validateConfig(config: CognitoConfig): void {
    if (!config.region) {
      throw new ConfigurationError('AWS Cognito region is required. Please set COGNITO_REGION environment variable.');
    }
    if (!config.userPoolId) {
      throw new ConfigurationError('AWS Cognito User Pool ID is required. Please set COGNITO_USER_POOL_ID environment variable.');
    }
    if (!config.clientId) {
      throw new ConfigurationError('AWS Cognito Client ID is required. Please set COGNITO_CLIENT_ID environment variable.');
    }
  }

  static createClient(config: CognitoConfig): CognitoIdentityProviderClient {
    this.validateConfig(config);
    return new CognitoIdentityProviderClient({ region: config.region });
  }

  static createJwtVerifier(config: CognitoConfig): ReturnType<typeof CognitoJwtVerifier.create> {
    this.validateConfig(config);
    return CognitoJwtVerifier.create({
      userPoolId: config.userPoolId,
      tokenUse: "access",
      clientId: config.clientId,
    });
  }
}