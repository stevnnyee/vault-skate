/**
 * User Validation Middleware
 * Defines validation schemas and middleware for user-related operations.
 * 
 * Features:
 * - Validates user registration and login
 * - Ensures password security requirements
 * - Validates profile updates and addresses
 * - Handles password changes
 * 
 * Validation Rules:
 * - Names: 2-50 characters
 * - Email: Valid email format
 * - Password: Min 8 chars, mixed case, numbers, special chars
 * - Phone: Optional, international format
 * - Dates: Valid dates, not in future
 * - Addresses: Required fields with proper format
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { UserRole } from '../../types/interfaces/user.interface';

/**
 * Validation Schemas
 * Define Joi validation schemas for different user operations
 */
const schemas = {
  // Registration validation schema
  // Validates new user registration data
  register: Joi.object({
    firstName: Joi.string().required().min(2).max(50),
    lastName: Joi.string().required().min(2).max(50),
    email: Joi.string().required().email(),
    password: Joi.string()
      .required()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      }),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.CUSTOMER)
  }),

  // Login validation schema
  // Validates user login credentials
  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  }),

  // Profile update validation schema
  // Validates profile information updates
  profileUpdate: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-()]{10,}$/).optional(),
    profilePicture: Joi.string().uri().optional(),
    dateOfBirth: Joi.date().max('now').optional()
  }),

  // Address validation schema
  // Validates shipping/billing address data
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    isDefault: Joi.boolean().optional(),
    label: Joi.string().optional()
  }),

  // Password change validation schema
  // Validates password change requests
  passwordChange: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .required()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .messages({
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      })
  })
};

/**
 * Validation Middleware Factory
 * Creates middleware functions that validate requests against specified schemas
 * 
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 * 
 * Error Handling:
 * - Returns 400 Bad Request for validation errors
 * - Includes detailed error messages for each invalid field
 * - Passes other errors to next error handler
 */
const validate = (schema: Joi.ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
      next(error);
    }
  };
};

// Export validation middleware for different operations
export const validateRegister = validate(schemas.register);
export const validateLogin = validate(schemas.login);
export const validateProfileUpdate = validate(schemas.profileUpdate);
export const validateAddress = validate(schemas.address);
export const validatePasswordChange = validate(schemas.passwordChange);