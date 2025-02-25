/**
 * Error Message Constants
 * Centralized location for all error messages used throughout the application.
 * Provides consistent error messaging and makes error handling more maintainable.
 */

/**
 * Authentication Error Messages
 * Used in authentication-related operations:
 * - Login attempts
 * - User registration
 * - Password management
 * - Token validation
 * - Access control
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password does not meet security requirements'
};

/**
 * Product Error Messages
 * Used in product management operations:
 * - Product creation and updates
 * - Inventory management
 * - Product retrieval
 * - Category validation
 * - SKU validation
 */
export const PRODUCT_ERRORS = {
  NOT_FOUND: 'Product not found',
  SKU_EXISTS: 'SKU already exists',
  INVALID_PRICE: 'Invalid product price',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  INVALID_CATEGORY: 'Invalid product category'
};

/**
 * Order Error Messages
 * Used in order processing operations:
 * - Order creation and updates
 * - Payment processing
 * - Shipping information validation
 * - Order status management
 * - Item validation
 */
export const ORDER_ERRORS = {
  NOT_FOUND: 'Order not found',
  INVALID_STATUS: 'Invalid order status',
  PAYMENT_FAILED: 'Payment processing failed',
  INVALID_ITEMS: 'Invalid order items',
  SHIPPING_REQUIRED: 'Shipping information required'
};

/**
 * Validation Error Messages
 * Generic validation error messages used across the application:
 * - Field presence validation
 * - Format validation
 * - Length validation
 * - Special format validation (email, phone)
 * 
 * Functions:
 * - REQUIRED_FIELD: Creates message for missing required fields
 * - INVALID_FORMAT: Creates message for incorrectly formatted fields
 * - MIN_LENGTH: Creates message for fields that are too short
 * - MAX_LENGTH: Creates message for fields that are too long
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
  MIN_LENGTH: (field: string, length: number) => `${field} must be at least ${length} characters long`,
  MAX_LENGTH: (field: string, length: number) => `${field} cannot exceed ${length} characters`,
  INVALID_EMAIL: 'Invalid email address format',
  INVALID_PHONE: 'Invalid phone number format'
};
