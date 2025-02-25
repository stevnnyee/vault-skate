/**
 * Authentication Controller Types
 * Type definitions for authentication and user management controllers.
 * 
 * Categories:
 * 1. Request Types:
 *    - Registration request
 *    - Login request
 *    - Profile update request
 *    - Address management requests
 * 
 * 2. Authentication Types:
 *    - Authenticated request base type
 *    - User session data
 *    - Token payload
 * 
 * 3. Response Types:
 *    - Authentication response
 *    - Profile response
 *    - Error response
 */

import { Request } from 'express';
import { UserRole, IUser } from '../models/user.types';
import { 
  RegisterUserInput, 
  LoginInput,
  ProfileUpdateInput,
  AddressInput
} from '../services/auth.service.types';

/**
 * Registration Request
 * Extended request type for user registration endpoint
 */
export interface RegisterRequest extends Request {
  body: RegisterUserInput;
}

/**
 * Login Request
 * Extended request type for user login endpoint
 */
export interface LoginRequest extends Request {
  body: LoginInput;
}

/**
 * Authenticated Request Base
 * Base type for all authenticated requests
 * Contains user session data from JWT token
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastLogin?: Date;
  };
}

/**
 * Profile Update Request
 * Extended authenticated request for profile updates
 */
export interface ProfileUpdateRequest extends AuthenticatedRequest {
  body: ProfileUpdateInput;
}

/**
 * Address Management Request
 * Extended authenticated request for address operations
 */
export interface AddressRequest extends AuthenticatedRequest {
  body: AddressInput;
}

/**
 * Address Removal Request
 * Extended authenticated request for address deletion
 */
export interface RemoveAddressRequest extends AuthenticatedRequest {
  params: {
    addressId: string;
  };
}

/**
 * Authentication Response Body
 * Standard response format for authentication operations
 * 
 * Properties:
 * - success: Operation success status
 * - message: Response message
 * - data: Optional response data containing user and token
 * - error: Optional error message
 */
export interface AuthResponseBody {
  success: boolean;
  message: string;
  data?: {
    user: Omit<IUser, 'password'>;
    token: string;
  };
  error?: string;
}