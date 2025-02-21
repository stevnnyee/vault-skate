/**
 * Authentication Service Type Definitions
 * Contains all TypeScript interfaces used by the authentication service.
 * 
 * Type Categories:
 * 1. Input Types:
 *    - User registration
 *    - Login credentials
 *    - Profile updates
 *    - Address management
 * 
 * 2. Response Types:
 *    - Authentication responses
 *    - Profile responses
 *    - Error responses
 * 
 * 3. Utility Types:
 *    - Address types
 *    - Password reset types
 *    - Token types
 */

import { IUser, UserRole, AuthProvider } from '../models/user.types';
import { IAddress } from '../models/common.types';
import { Types } from 'mongoose';

/**
 * Base Address Type
 * Foundation for all address-related interfaces
 * Excludes system-managed fields
 */
export type AddressInputBase = Omit<IAddress, 'isDefault' | '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Address Input Type
 * Used for creating and updating addresses
 * Extends base type with optional fields
 */
export interface AddressInput extends AddressInputBase {
  isDefault?: boolean;  // Optional in input
  label?: string;       // e.g., "Home", "Work", etc.
}

/**
 * Address Save Type
 * Internal type for saving addresses to database
 * Includes all required fields except system IDs
 */
export type AddressToSave = Omit<IAddress, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * User Registration Input
 * Required data for creating a new user account
 * Includes validation for required and optional fields
 */
export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  role?: UserRole;  // Optional role, defaults to CUSTOMER
}

/**
 * Login Input
 * Credentials required for user authentication
 * Includes optional remember me flag
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;  // Add option for extended session
}

/**
 * Authentication Response
 * Standard response format for authentication operations
 * Includes user data and authentication tokens
 */
export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
  refreshToken?: string;  // Add refresh token support
  expiresIn: number;     // Token expiration time
}

/**
 * Profile Update Input
 * Fields that can be updated in user profile
 * Some updates may require current password verification
 */
export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: Date;
  currentPassword?: string;  // Required for sensitive updates
  newPassword?: string;      // Optional password update
}

/**
 * Password Reset Request
 * Input for initiating password reset process
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password Reset Confirmation
 * Input for completing password reset process
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}