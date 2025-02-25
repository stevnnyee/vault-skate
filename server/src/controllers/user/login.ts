/**
 * User Login Controller
 * Handles user authentication requests
 * 
 * @param req - Express request object containing login credentials
 * @param res - Express response object
 * @returns JSON response with user data and authentication token
 * 
 * Flow:
 * 1. Extracts login credentials from request body
 * 2. Authenticates user via authService
 * 3. Returns success response with user data and token
 * 4. Handles authentication failures
 */
import { Response } from 'express';
import { LoginRequest } from '../../types/controllers/auth.controller.types';
import { authService } from '../../services/auth.service';

export const login = async (req: LoginRequest, res: Response) => {
  try {
    const loginData = req.body;
    const { user, token } = await authService.login(loginData);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};
