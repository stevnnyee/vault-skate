// src/types/user.types.ts
import { Types } from 'mongoose';
import { IAddress } from './common.types';  

/**
 * User role enumeration
 * Defines different access levels
 */
export enum UserRole {
  CUSTOMER = 'Customer',        // Regular customer
  ADMIN = 'Admin',             // Site administrator
  MODERATOR = 'Moderator'      // Content moderator
}

/**
 * User interface
 * Defines the structure for user documents
 * @interface IUser
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
  lastLogin?: Date;             // Last login timestamp
  createdAt: Date;              // Document creation date
  updatedAt: Date;              // Last update date
}