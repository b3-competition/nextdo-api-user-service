export interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  clientSecret?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  age: string;
  educationLevel: string;
  currentRole: string;
  portfolio?: string;
  firstName?: string;
  lastName?: string;
  aiPreferences?: {
    interests: string[];
    goals: string[];
    communicationStyle: string;
  };
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  marketingConsent?: boolean;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  message: string;
  userSub?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  payload?: any;
}