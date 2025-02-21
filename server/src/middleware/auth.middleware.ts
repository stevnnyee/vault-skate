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
import { AuthenticatedRequest } from '../types/controllers/auth.controller.types';
import { UserRole } from '../types/models/user.types';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
    };

    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isActive: true,
      lastLogin: new Date()
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }
  next();
};
