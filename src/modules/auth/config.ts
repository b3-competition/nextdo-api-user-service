import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoConfig } from "./models";

export class CognitoClientFactory {
  static createClient(config: CognitoConfig): CognitoIdentityProviderClient {
    return new CognitoIdentityProviderClient({ region: config.region });
  }

  static createJwtVerifier(config: CognitoConfig): ReturnType<typeof CognitoJwtVerifier.create> | null {
    if (!config.userPoolId || !config.clientId) {
      console.warn('⚠️  AWS Cognito configuration is incomplete. Authentication endpoints will not work properly.');
      return null;
    }

    return CognitoJwtVerifier.create({
      userPoolId: config.userPoolId,
      tokenUse: "access",
      clientId: config.clientId,
    });
  }
}