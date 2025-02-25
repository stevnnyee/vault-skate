/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication for protected routes.
 * 
 * Features:
 * - Extracts JWT token from Authorization header
 * - Validates token signature and expiration
 * - Decodes user information from token
 * - Attaches user data to request object
 * 
 * Security:
 * - Requires Bearer token in Authorization header
 * - Verifies token using JWT_SECRET environment variable
 * - Checks token expiration automatically
 * - Sanitizes error messages in production
 * 
 * Usage:
 * Apply to routes that require authentication:
 * router.get('/protected', authenticate, handler)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../types/models/user.types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
};

/**
 * Authorization Middleware Factory
 * Creates middleware to check user roles
 * 
 * @param roles - Array of allowed roles
 * @returns Middleware function
 */
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user has admin role
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      error: 'User not authenticated'
    });
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
  }

  next();
};

/**
 * Combined Authentication and Role Check
 * Convenience middleware that combines authentication and role check
 * 
 * @param roles - Array of allowed roles
 * @returns Array of middleware functions
 */
export const authenticateAndAuthorize = (roles: string[]) => {
  return [authenticate, authorize(roles)];
};
