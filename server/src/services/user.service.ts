/**
 * User Service
 * Handles core user management functionality and data access.
 * 
 * Core Functionalities:
 * 1. User Management:
 *    - User creation and registration
 *    - Profile updates and retrieval
 *    - Account status management
 *    - User search and filtering
 * 
 * 2. Security:
 *    - Password hashing
 *    - Account verification
 *    - Login tracking
 *    - Session management
 * 
 * Features:
 * - Secure password handling
 * - Email verification
 * - Last login tracking
 * - Failed login attempt monitoring
 * - Account lockout protection
 */

import bcrypt from 'bcryptjs';
import User from '../models/user';
import { RegisterUserInput } from '../types/services/auth.service.types';
import { IUser, UserRole } from '../types/models/user.types';
import { Types } from 'mongoose';

class UserService {
  /**
   * Creates a new user
   * Handles user registration with secure password handling
   * Note: Password hashing is handled by User model middleware
   * 
   * @param userData - User registration data
   * @returns Newly created user document
   * @throws Error if email already exists or validation fails
   */
  async createUser(userData: RegisterUserInput): Promise<IUser & { _id: Types.ObjectId }> {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const user = new User({
        ...userData,
        role: userData.role || UserRole.CUSTOMER,
        isActive: true,
        isEmailVerified: false,
        addresses: [],
        preferences: {
          language: 'en',
          currency: 'USD',
          notifications: {
            email: true,
            sms: false
          }
        },
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedUser = await user.save();
      return savedUser.toObject();
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Error creating user');
    }
  }

  /**
   * Finds a user by email
   * Used for authentication and password reset
   * 
   * @param email - User's email address
   * @returns User document if found
   * @throws Error if user not found
   */
  async findByEmail(email: string): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  }

  /**
   * Updates user's last login timestamp
   * Tracks user activity and session management
   * 
   * @param userId - ID of the user to update
   * @returns Updated user document
   * @throws Error if update fails
   */
  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { 
      lastLogin: new Date(),
      $inc: { loginCount: 1 }
    });
  }

  /**
   * Finds a user by ID
   * Used for retrieving user details
   * 
   * @param userId - ID of the user to find
   * @returns User document if found
   * @throws Error if user not found
   */
  async findById(userId: string): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    const user = await User.findById(userId);
    return user ? user.toObject() : null;
  }

  /**
   * Records failed login attempt
   * Implements account lockout protection
   * 
   * @param email - Email of the user
   * @returns Updated user document
   * @throws Error if update fails
   */
  async recordFailedLogin(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
        
        await user.save();
      }
    } catch (error) {
      throw new Error('Failed to record login attempt');
    }
  }
}

// Export both the class and a singleton instance
export { UserService };
export const userService = new UserService(); 