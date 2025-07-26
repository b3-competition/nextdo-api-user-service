# AWS Cognito Setup Guide

This guide explains how to set up AWS Cognito for the NextDo API User Service authentication system.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional)
- Access to AWS Management Console

## Step 1: Create a Cognito User Pool

1. **Navigate to AWS Cognito Console**
   - Go to [AWS Management Console](https://console.aws.amazon.com/)
   - Search for "Cognito" and select "Amazon Cognito"

2. **Create User Pool**
   - Click "Create user pool"
   - Choose "Review defaults" for a quick setup, or "Step through settings" for custom configuration

3. **Configure Sign-in Options**
   - Select "Email" as the sign-in option
   - You can also enable "Username" if needed

4. **Configure Security Requirements**
   - Set password policy (minimum 8 characters, uppercase, lowercase, numbers, special characters)
   - Enable MFA if required (optional for basic setup)

5. **Configure Sign-up Experience**
   - Enable "Allow users to sign themselves up"
   - Select required attributes: Email (required)
   - Optional attributes: given_name (first name), family_name (last name)

6. **Configure Message Delivery**
   - Choose "Send email with Cognito" for simplicity
   - You can configure SES later for production

7. **Integrate Your App**
   - Enter app client name: "nextdo-user-service"
   - **IMPORTANT**: Don't generate a client secret (our app uses USER_PASSWORD_AUTH flow)
   - Select "ALLOW_USER_PASSWORD_AUTH" in authentication flows

8. **Review and Create**
   - Review all settings
   - Click "Create user pool"

## Step 2: Configure User Pool Settings

1. **Enable USER_PASSWORD_AUTH Flow**
   - Go to your User Pool → App integration → App clients
   - Select your app client
   - Under "Authentication flows", ensure "ALLOW_USER_PASSWORD_AUTH" is enabled
   - Save changes

2. **Configure Password Recovery**
   - Go to User Pool → Policies
   - Configure password recovery options
   - Enable "Email" for password recovery

## Step 3: Get Configuration Values

After creating the User Pool, you'll need these values for your `.env` file:

1. **User Pool ID**
   - Go to User Pool → General settings
   - Copy the Pool Id (format: us-east-1_xxxxxxxxx)

2. **App Client ID**
   - Go to User Pool → App integration → App clients
   - Copy the Client ID

3. **AWS Region**
   - Note the region where you created the User Pool (e.g., us-east-1)

## Step 4: Update Environment Variables

Create a `.env` file in your project root with the following values:

```env
# Server Configuration
PORT=8001
API_VERSION=1

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 5: Set Up AWS Credentials

You need AWS credentials to allow your application to interact with Cognito:

### Option 1: AWS Credentials File
```bash
aws configure
```

### Option 2: Environment Variables
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### Option 3: IAM Role (for EC2/Lambda deployment)
Create an IAM role with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminSetUserPassword",
                "cognito-idp:SignUp",
                "cognito-idp:ConfirmSignUp",
                "cognito-idp:InitiateAuth",
                "cognito-idp:ForgotPassword",
                "cognito-idp:ConfirmForgotPassword",
                "cognito-idp:ResendConfirmationCode"
            ],
            "Resource": "arn:aws:cognito-idp:your-region:your-account:userpool/your-user-pool-id"
        }
    ]
}
```

## Step 6: Test the Setup

1. **Start your server**
   ```bash
   pnpm run dev
   ```

2. **Test signup endpoint**
   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123!",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

3. **Check your email for confirmation code**

4. **Test confirmation endpoint**
   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/confirm-signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "confirmationCode": "123456"
     }'
   ```

5. **Test login endpoint**
   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123!"
     }'
   ```

## Available API Endpoints

- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/confirm-signup` - Confirm email with OTP
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/forgot-password` - Initiate password reset
- `POST /api/v1/auth/confirm-forgot-password` - Confirm password reset with OTP
- `POST /api/v1/auth/resend-confirmation` - Resend confirmation code
- `GET /api/v1/auth/verify-token` - Verify JWT token
- `GET /api/v1/protected` - Protected endpoint example

## Running Bruno Tests

```bash
pnpm run test
```

This will run all the Bruno API tests to verify the authentication system is working correctly.

## Troubleshooting

### Common Issues:

1. **"User does not exist" error during login**
   - Make sure the user has confirmed their email
   - Check that the email address is correct

2. **"Invalid authentication flow" error**
   - Ensure USER_PASSWORD_AUTH is enabled in your app client settings

3. **"Access denied" error**
   - Check your AWS credentials and permissions
   - Verify the User Pool ID and Client ID are correct

4. **"TokenUse parameter is required" error**
   - This is related to JWT verification, ensure your tokens are properly formatted

### Production Considerations:

1. **Use SES for email delivery** in production instead of Cognito's built-in email
2. **Enable MFA** for enhanced security
3. **Configure custom attributes** as needed
4. **Set up proper monitoring** and logging
5. **Use environment-specific User Pools** (dev, staging, prod)