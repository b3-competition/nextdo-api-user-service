import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Complete signup schema matching frontend flow
export const signupSchema = z.object({
  // Personal Information (required)
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  
  age: z.string()
    .min(1, "Age is required")
    .refine((val: string) => {
      const num = parseInt(val);
      return num >= 13 && num <= 120;
    }, "Age must be between 13 and 120"),
  
  educationLevel: z.enum([
    "High School",
    "Associate Degree",
    "Bachelor's Degree", 
    "Master's Degree",
    "PhD",
    "Other"
  ], { message: "Please select a valid education level" }),
  
  currentRole: z.string()
    .min(2, "Current role must be at least 2 characters")
    .max(100, "Current role cannot exceed 100 characters"),
  
  portfolio: z.string()
    .url("Portfolio must be a valid URL")
    .optional()
    .or(z.literal("")),

  // AI Personalization (required)
  aiPreferences: z.object({
    interests: z.array(z.string())
      .min(1, "Select at least one interest"),
    goals: z.array(z.string())
      .min(1, "Select at least one goal"),
    communicationStyle: z.string()
      .min(1, "Communication style is required"),
  }),

  // Identity & Auth (required)
  email: z.string()
    .email("Invalid email address"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),

  // OTP (for confirmation step)
  otp: z.string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers")
    .optional(),

  // Terms (required)
  acceptedTerms: z.boolean()
    .refine((val: boolean) => val === true, "You must accept the terms"),
  acceptedPrivacy: z.boolean()
    .refine((val: boolean) => val === true, "You must accept the privacy policy"),
  marketingConsent: z.boolean()
    .default(false),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Email confirmation schema
export const confirmSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  confirmationCode: z.string()
    .length(6, "Confirmation code must be 6 digits")
    .regex(/^\d+$/, "Confirmation code must contain only numbers"),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Confirm forgot password schema
export const confirmForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  confirmationCode: z.string()
    .length(6, "Confirmation code must be 6 digits")
    .regex(/^\d+$/, "Confirmation code must contain only numbers"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Validation middleware using Zod
export const validateZodRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Replace body with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Check if this is a signup validation and create simplified message
        const isSignupValidation = schema === signupSchema;
        if (isSignupValidation) {
          return res.status(400).json({
            success: false,
            message: "Email, password, full name, age, education level, current role, AI preferences, and terms acceptance are required"
          });
        }
        
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Invalid request data',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      
      // Handle unexpected errors
      return res.status(500).json({
        success: false,
        error: 'InternalServerError',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
};

// Partial validation for multi-step signup
export const validateSignupStep = (step: 'personal' | 'ai' | 'identity' | 'otp' | 'terms') => {
  const schemas = {
    personal: z.object({
      fullName: signupSchema.shape.fullName,
      age: signupSchema.shape.age,
      educationLevel: signupSchema.shape.educationLevel,
      currentRole: signupSchema.shape.currentRole,
      portfolio: signupSchema.shape.portfolio,
    }),
    ai: z.object({
      aiPreferences: signupSchema.shape.aiPreferences,
    }),
    identity: z.object({
      email: signupSchema.shape.email,
      password: signupSchema.shape.password,
    }),
    otp: z.object({
      email: signupSchema.shape.email,
      otp: signupSchema.shape.otp.unwrap(), // Remove optional
    }),
    terms: z.object({
      acceptedTerms: signupSchema.shape.acceptedTerms,
      acceptedPrivacy: signupSchema.shape.acceptedPrivacy,
      marketingConsent: signupSchema.shape.marketingConsent,
    }),
  };

  return validateZodRequest(schemas[step]);
};