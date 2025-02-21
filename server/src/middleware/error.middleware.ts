/**
 * Error Handling Middleware
 * Provides centralized error handling for the application with different
 * behavior in development and production environments.
 * 
 * Features:
 * - Centralizes all error handling logic
 * - Differentiates between development and production errors
 * - Formats error responses consistently
 * - Handles both operational and programming errors
 * 
 * Error Types:
 * - Operational errors (e.g., validation errors, invalid input)
 * - Programming errors (e.g., null references, type errors)
 * - Network errors (e.g., database connection issues)
 * - Authentication errors (e.g., invalid tokens)
 * 
 * Response Format:
 * Development:
 * - Includes full error stack trace
 * - Shows detailed error information
 * - Includes error type and status
 * 
 * Production:
 * - Hides implementation details
 * - Shows user-friendly messages
 * - Logs errors for debugging
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Extended Error interface for application-specific error properties
 * Adds status code, status string, and operational flag for better error handling
 */
interface AppError extends Error {
  statusCode?: number;     // HTTP status code
  status?: string;        // Error status string (e.g., 'fail', 'error')
  isOperational?: boolean; // Whether this is an operational error (vs programming error)
}

/**
 * Global error handling middleware
 * Catches all errors and formats them appropriately based on environment
 * 
 * @param err - The error object with optional custom properties
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * Error Processing:
 * 1. Sets default status code and status
 * 2. Checks environment (development/production)
 * 3. Formats error response accordingly
 * 4. Sends appropriate HTTP status code
 */
export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default error properties if not provided
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // Development: send detailed error information
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production: send limited error information for security
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.isOperational ? err.message : 'Something went wrong'
    });
  }
};
