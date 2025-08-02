export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ConfigurationError extends AuthError {
  constructor(message: string = 'AWS Cognito configuration is incomplete') {
    super(message, 'ConfigurationError');
    this.name = 'ConfigurationError';
  }
}

export class TokenVerificationError extends AuthError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 'TokenVerificationError');
    this.name = 'TokenVerificationError';
  }
}

export class AuthenticationError extends AuthError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AuthenticationFailed');
    this.name = 'AuthenticationError';
  }
}