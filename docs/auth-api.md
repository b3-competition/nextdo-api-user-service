# Authentication API Documentation

This document provides the API endpoints for user authentication using AWS Cognito.

## Base URL
```
http://localhost:8001/api/v1/auth
```

## Authentication Endpoints

### 1. User Signup
**POST** `/signup`

Creates a new user account with profile information.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "age": 25,
  "educationLevel": "Bachelor's Degree",
  "currentRole": "Software Developer",
  "portfolio": "https://johndoe.dev" // Optional
}
```

**Response (201 - Success):**
```json
{
  "success": true,
  "userSub": "12345678-1234-1234-1234-123456789012",
  "message": "User registered successfully. Please check your email for confirmation code."
}
```

**Response (400 - Validation Error):**
```json
{
  "success": false,
  "message": "Email, password, full name, age, education level, and current role are required"
}
```

---

### 2. Confirm Signup
**POST** `/confirm-signup`

Confirms user email with the code sent during signup.

**Request Body:**
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456"
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "Email confirmed successfully. You can now log in."
}
```

---

### 3. User Login
**POST** `/login`

Authenticates user and returns access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "message": "Login successful"
}
```

**Response (401 - Authentication Failed):**
```json
{
  "success": false,
  "error": "NotAuthorizedException",
  "message": "Incorrect username or password."
}
```

---

### 4. Forgot Password
**POST** `/forgot-password`

Initiates password reset process by sending a code to user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "Password reset code sent to your email."
}
```

---

### 5. Confirm Forgot Password
**POST** `/confirm-forgot-password`

Resets password using the confirmation code from email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

---

### 6. Resend Confirmation Code
**POST** `/resend-confirmation`

Resends the email confirmation code to user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "Confirmation code resent to your email."
}
```

---

### 7. Verify Token
**GET** `/verify-token`

Validates an access token and returns user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 - Success):**
```json
{
  "success": true,
  "payload": {
    "sub": "12345678-1234-1234-1234-123456789012",
    "email": "user@example.com",
    "name": "John Doe",
    "custom:age": "25",
    "custom:education_level": "Bachelor's Degree",
    "custom:current_role": "Software Developer",
    "custom:portfolio": "https://johndoe.dev",
    "exp": 1640995200,
    "iat": 1640991600
  },
  "message": "Token is valid"
}
```

**Response (401 - Invalid Token):**
```json
{
  "success": false,
  "error": "TokenVerificationError",
  "message": "Invalid or expired token"
}
```

---

## Protected Routes Example

### Test Protected Endpoint
**GET** `/api/v1/protected`

Example of a protected route that requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 - Success):**
```json
{
  "success": true,
  "message": "This is a protected endpoint",
  "user": {
    "sub": "12345678-1234-1234-1234-123456789012",
    "email": "user@example.com",
    "name": "John Doe",
    // ... other user attributes
  }
}
```

---

## Error Responses

All endpoints may return these common error responses:

**500 - Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

**400 - Bad Request:**
```json
{
  "success": false,
  "error": "ValidationException",
  "message": "Specific validation error message"
}
```

---

## User Profile Fields

When signing up, the following user profile information is stored:

- **fullName**: User's full name (stored as `name` attribute)
- **age**: User's age (stored as `custom:age` attribute)
- **educationLevel**: Education level (stored as `custom:education_level` attribute)
- **currentRole**: Current job role (stored as `custom:current_role` attribute)
- **portfolio**: Optional portfolio URL (stored as `custom:portfolio` attribute)

---

## Authentication Flow

1. **Signup**: User registers with profile information
2. **Confirm**: User confirms email with code sent to their email
3. **Login**: User logs in and receives access/refresh tokens
4. **Access Protected Routes**: Use access token in Authorization header
5. **Token Verification**: Validate tokens before accessing protected resources

---

## Notes for Frontend Developers

- Always include `Content-Type: application/json` in request headers
- Store `accessToken` securely (consider using httpOnly cookies)
- Implement token refresh logic using `refreshToken`
- Handle authentication errors gracefully
- The `expiresIn` field indicates token lifetime in seconds
- Use the `/verify-token` endpoint to check token validity before making requests