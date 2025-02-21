import { Types } from 'mongoose';

export interface IAddress {
    _id?: string;         // Unique identifier for each address
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;   // Default shipping address
    label?: string;       // Address label
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface IUser {
    _id?: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    addresses: IAddress[];
    phoneNumber?: string;
    dateOfBirth?: Date;
    profilePicture?: string;
    isActive: boolean;
    isEmailVerified: boolean;    // Track email verification
    lastLogin?: Date;
    lastPasswordChange?: Date;   // Track password changes
    failedLoginAttempts?: number; // Security feature
    lockoutUntil?: Date;         // Account lockout
    refreshToken?: string;       // For JWT refresh
    preferences?: {              // User preferences
      language?: string;
      currency?: string;
      notifications?: {
        email: boolean;
        sms: boolean;
      };
    };
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export enum UserRole {
    ADMIN = 'admin',
    CUSTOMER = 'customer',
    MANAGER = 'manager'    // Add intermediate role
  }
  
  // Add authentication-related enums
  export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    FACEBOOK = 'facebook'
  }
  
  export enum TokenType {
    ACCESS = 'access',
    REFRESH = 'refresh',
    RESET_PASSWORD = 'reset_password',
    VERIFY_EMAIL = 'verify_email'
  }