// src/types/models/user.types.ts
import { Types } from 'mongoose';
import { IAddress } from './common.types';

/**
 * User role enumeration
 * Defines different access levels
 */
export enum UserRole {
  CUSTOMER = 'customer',        // Regular customer
  ADMIN = 'admin',             // Site administrator
  MODERATOR = 'moderator'      // Content moderator
}

/**
 * Authentication provider enumeration
 * Defines supported authentication methods
 */
export enum AuthProvider {
  LOCAL = 'local',             // Email/password authentication
  GOOGLE = 'google',           // Google OAuth
  FACEBOOK = 'facebook'        // Facebook OAuth
}

/**
 * User preferences interface
 * Defines user-specific settings
 */
export interface IUserPreferences {
  language: string;            // Preferred language
  currency: string;            // Preferred currency
  notifications: {             // Notification preferences
    email: boolean;           // Email notifications enabled
    sms: boolean;             // SMS notifications enabled
  };
}

/**
 * User interface
 * Defines the structure for user documents
 */
export interface IUser {
  _id: Types.ObjectId;          // MongoDB document ID
  firstName: string;            // User's first name
  lastName: string;             // User's last name
  email: string;                // User's email (unique)
  password: string;             // Hashed password
  role: UserRole;               // User's role
  addresses: IAddress[];        // User's addresses
  phoneNumber?: string;         // Optional phone number
  dateOfBirth?: Date;          // Optional birth date
  profilePicture?: string;      // Optional profile picture URL
  isActive: boolean;            // Account status
  isEmailVerified: boolean;     // Email verification status
  lastLogin?: Date;             // Last login timestamp
  lastPasswordChange?: Date;    // Last password change date
  failedLoginAttempts: number;  // Failed login attempt counter
  lockoutUntil?: Date;         // Account lockout expiry
  refreshToken?: string;        // JWT refresh token
  authProvider?: AuthProvider;  // Authentication provider
  preferences: IUserPreferences;// User preferences
  createdAt: Date;             // Document creation date
  updatedAt: Date;             // Last update date
}