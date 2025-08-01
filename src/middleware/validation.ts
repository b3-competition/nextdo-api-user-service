import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required'
  }),
  // Optional fields for validation but not stored in Cognito attributes
  age: Joi.number().integer().min(13).max(120).optional().messages({
    'number.min': 'Age must be at least 13',
    'number.max': 'Age cannot exceed 120'
  }),
  educationLevel: Joi.string().valid(
    'High School',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'Other'
  ).optional().messages({
    'any.only': 'Please select a valid education level'
  }),
  currentRole: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Current role must be at least 2 characters',
    'string.max': 'Current role cannot exceed 100 characters'
  }),
  portfolio: Joi.string().uri().optional().messages({
    'string.uri': 'Portfolio must be a valid URL'
  }),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(1).required().messages({
    'any.required': 'Password is required'
  })
});

export const confirmSignUpSchema = Joi.object({
  email: Joi.string().email().required(),
  confirmationCode: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Confirmation code must be 6 digits',
    'string.pattern.base': 'Confirmation code must contain only numbers'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const confirmForgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  confirmationCode: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: error.details[0].message,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};