/**
 * User Registration Controller
 * Handles new user registration requests
 * 
 * @param req - Express request object containing registration data
 * @param res - Express response object
 * @returns JSON response with user data and authentication token
 * 
 * Flow:
 * 1. Extracts user data from request body
 * 2. Calls authService to register user
 * 3. Returns success response with user data and token
 * 4. Handles any registration errors
 */
import { Response } from 'express';
import { RegisterRequest } from '../../types/controllers/auth.controller.types';
import { authService } from '../../services/auth.service';

export const register = async (req: RegisterRequest, res: Response) => {
  try {
    const userData = req.body;
    const { user, token } = await authService.register(userData);
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};
