/**
 * Authentication Service
 * Handles all authentication-related business logic including user registration,
 * login, password management, and address management.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/user';
import { 
  RegisterUserInput, 
  LoginInput,
  ProfileUpdateInput,
  AddressInput,
  AuthResponse 
} from '../types/services/auth.service.types';
import { IUser, UserRole } from '../types/models/user.types';
import { IAddress } from '../types/models/common.types';
import { UserService, userService } from './user.service';
import { Types } from 'mongoose';

/**
 * AuthService Class
 * Provides methods for user authentication and management
 */
class AuthService {
  private generateToken(user: IUser & { _id: Types.ObjectId }): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    return jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  private sanitizeUser(user: IUserDocument): Omit<IUser, 'password'> {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }
  
  /**
   * Prepares an address object for storage
   * Adds default values and timestamps to the address input
   */
  private prepareAddress(addressInput: AddressInput): IAddress {
    return {
      ...addressInput,
      isDefault: addressInput.isDefault ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * Registers a new user
   * Creates a new user account with hashed password and default role
   */
  async register(userData: RegisterUserInput): Promise<AuthResponse> {
    try {
      // Register user using UserService
      const user = await userService.createUser(userData);
      const userDoc = await User.findById(user._id);
      if (!userDoc) {
        throw new Error('Failed to create user');
      }
      
      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(userDoc),
        token,
        expiresIn: 86400 // 24 hours in seconds
      };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Registration failed');
    }
  }
  
  /**
   * Authenticates a user
   * Verifies credentials and returns a JWT token if valid
   */
  async login(loginData: LoginInput): Promise<AuthResponse> {
    try {
      const user = await User.findOne({ email: loginData.email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      const isValidPassword = await user.comparePassword(loginData.password);
      if (!isValidPassword) {
        // Record failed login attempt
        await userService.recordFailedLogin(loginData.email);
        throw new Error('Invalid credentials');
      }

      // Reset failed login attempts on successful login
      user.failedLoginAttempts = 0;
      user.lockoutUntil = undefined;

      // Update last login time
      user.lastLogin = new Date();
      await user.save();

      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token,
        expiresIn: 86400 // 24 hours in seconds
      };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Login failed');
    }
  }
  
  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return this.sanitizeUser(user);
  }
  
  /**
   * Updates a user's profile
   * Modifies user information while maintaining security
   */
  async updateProfile(userId: string, updates: ProfileUpdateInput): Promise<Omit<IUser, 'password'>> {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return this.sanitizeUser(updatedUser);
  }
  
  /**
   * Adds a new address to a user's profile
   * Handles default address logic
   */
  async addAddress(userId: string, addressInput: AddressInput): Promise<Omit<IUser, 'password'>> {
    try {
      const userDoc = await User.findById(userId);
      if (!userDoc) {
        throw new Error('User not found');
      }

      const address = this.prepareAddress(addressInput);
      userDoc.addresses = userDoc.addresses || [];
      
      // If this is the first address or isDefault is true, update other addresses
      if (address.isDefault || userDoc.addresses.length === 0) {
        userDoc.addresses = userDoc.addresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
      }
      
      userDoc.addresses.push(address);
      await userDoc.save();

      return this.sanitizeUser(userDoc);
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Failed to add address');
    }
  }
  
  async removeAddress(userId: string, addressIndex: number): Promise<Omit<IUser, 'password'>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.addresses || !user.addresses[addressIndex]) {
      throw new Error('Address not found');
    }
    
    user.addresses.splice(addressIndex, 1);
    await user.save();
    
    return this.sanitizeUser(user);
  }
  
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return true;
  }
}

// Export both the class and a singleton instance
export { AuthService };
export const authService = new AuthService();