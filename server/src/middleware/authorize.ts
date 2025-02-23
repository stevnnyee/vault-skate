import { Response, NextFunction } from 'express';
import { UserRole } from '../types/models/user.types';
import { AuthenticatedRequest } from './auth';

export const authorize = (roles: UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization failed'
      });
    }
  };
}; 