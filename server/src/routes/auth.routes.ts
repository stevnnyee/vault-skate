/**
 * Authentication Routes
 * Defines all authentication and user profile management endpoints.
 * 
 * Route Categories:
 * 1. Public Routes:
 *    - User registration
 *    - User login
 * 
 * 2. Protected Routes:
 *    - Profile management
 *    - Address management
 *    - Password changes
 * 
 * Authentication:
 * - Public routes accessible without authentication
 * - Protected routes require valid JWT token
 * - Token validation through authenticate middleware
 * 
 * Features:
 * - User registration with validation
 * - Secure login with JWT token generation
 * - Profile updates with field validation
 * - Address book management (add/remove addresses)
 * - Password change with current password verification
 * 
 * Security:
 * - Password hashing
 * - JWT token authentication
 * - Input validation
 * - Protected route middleware
 */

import { Router } from 'express';
import { register } from '../controllers/user/register';
import { login } from '../controllers/user/login';
import { 
  getProfile, 
  updateProfile,
  addAddress,
  removeAddress,
  changePassword
} from '../controllers/user/profile';
import { authenticate } from '../middleware/auth.middleware';
import { 
  validateRegister, 
  validateLogin, 
  validateProfileUpdate,
  validateAddress,
  validatePasswordChange
} from '../middleware/validation/user.validation';
import { 
  AuthenticatedRequest,
  RemoveAddressRequest 
} from '../types/controllers/auth.controller.types';
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

const router = Router();

// Public authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected profile routes - require authentication
router.get(
  '/profile', 
  authenticate, 
  (req: Request, res: Response) => getProfile(req as AuthenticatedRequest, res)
);

router.put(
  '/profile', 
  authenticate, 
  validateProfileUpdate,
  (req: Request, res: Response) => updateProfile(req as AuthenticatedRequest, res)
);

// Protected address management routes
router.post(
  '/address', 
  authenticate, 
  validateAddress,
  async (req: Request, res: Response) => {
    try {
      const user = await authService.addAddress((req as AuthenticatedRequest).user.id, req.body);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add address'
      });
    }
  }
);

router.delete(
  '/address/:addressId', 
  authenticate,
  (req: Request, res: Response) => removeAddress(req as RemoveAddressRequest, res)
);

// Protected password management route
router.post(
  '/change-password', 
  authenticate, 
  validatePasswordChange,
  (req: Request, res: Response) => changePassword(req as AuthenticatedRequest, res)
);

export default router;