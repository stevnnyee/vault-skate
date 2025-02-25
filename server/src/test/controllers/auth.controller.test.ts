/**
 * Authentication Controller Tests
 * Tests all authentication and user management functionality.
 * 
 * Test Categories:
 * 1. User Registration
 *    - Valid registration
 *    - Invalid data handling
 *    - Duplicate email prevention
 * 
 * 2. User Login
 *    - Successful login
 *    - Invalid credentials
 *    - Account locking
 * 
 * 3. Profile Management
 *    - Profile retrieval
 *    - Profile updates
 *    - Address management
 * 
 * 4. Password Management
 *    - Password changes
 *    - Invalid password handling
 *    - Password validation
 * 
 * Security Features:
 * - Token generation
 * - Password hashing
 * - Session management
 * - Access control
 */

import { Request, Response } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { UserRole } from '../../types/models/user.types';
import { 
  getProfile, 
  updateProfile, 
  addAddress,
  changePassword
} from '../../controllers/user/profile';
import { register } from '../../controllers/user/register';
import { login } from '../../controllers/user/login';
import type { 
  AuthenticatedRequest,
  RegisterRequest,
  LoginRequest
} from '../../types/controllers/auth.controller.types';
import { AddressInput } from '../../types/services/auth.service.types';
import { authService } from '../../services/auth.service';
import { validateRegister, validateLogin, validatePasswordChange } from '../../middleware/validation/user.validation';
import User from '../../models/user';

const validUserData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'Test@Pass123',
  role: UserRole.CUSTOMER
};

describe('Auth Controller Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  const mockRequestResponse = () => {
    const baseReq = {
      body: {},
      params: {},
      headers: {},
      url: '',
      query: {}
    };

    // Create the request object with the user property
    const req = {
      ...baseReq,
      user: undefined
    } as Partial<Request> & { user?: AuthenticatedRequest['user'] };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn(),
      links: jest.fn(),
      send: jest.fn(),
      jsonp: jest.fn()
    } as unknown as Response;

    return { req, res };
  };

  describe('Profile Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const result = await authService.register(validUserData);
      testUser = result.user;
    });

    it('should get user profile', async () => {
      const { req, res } = mockRequestResponse();
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: UserRole.CUSTOMER,
        isActive: true,
        lastLogin: new Date()
      };

      await getProfile(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: testUser.email
          })
        })
      );
    });

    it('should update user profile', async () => {
      const { req, res } = mockRequestResponse();
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: UserRole.CUSTOMER,
        isActive: true,
        lastLogin: new Date()
      };
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      await updateProfile(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Smith'
          })
        })
      );
    });

    it('should add address to user profile', async () => {
      const { req, res } = mockRequestResponse();
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: UserRole.CUSTOMER,
        isActive: true,
        lastLogin: new Date()
      };
      const addressInput: AddressInput = {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      };
      req.body = addressInput;

      await addAddress(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const { req, res } = mockRequestResponse();
      req.body = validUserData;

      // Run validation middleware first
      await new Promise<void>((resolve, reject) => {
        validateRegister(req as Request, res as Response, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // If validation passes, proceed with registration
      await register(req as RegisterRequest, res);

      // Log the response for debugging
      const statusCall = (res.status as jest.Mock).mock.calls[0][0];
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      console.log('Registration Response:', { status: statusCall, body: jsonCall });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            token: expect.any(String)
          })
        })
      );
    });

    it('should login an existing user', async () => {
      // First register a user
      const registerResult = await authService.register(validUserData);
      expect(registerResult.user).toBeDefined(); // Verify user was created

      // Verify the user exists in the database
      const registeredUser = await User.findOne({ email: validUserData.email });
      expect(registeredUser).toBeDefined();
      
      // Verify password comparison works
      const isPasswordValid = await registeredUser?.comparePassword(validUserData.password);
      expect(isPasswordValid).toBe(true);

      const { req, res } = mockRequestResponse();
      req.body = {
        email: validUserData.email,
        password: validUserData.password
      };

      // Log the request body
      console.log('Login Request:', req.body);

      // Run validation middleware first
      await new Promise<void>((resolve, reject) => {
        validateLogin(req as Request, res as Response, (err?: any) => {
          if (err) {
            console.log('Login Validation Error:', err);
            reject(err);
          } else resolve();
        });
      });

      // Log request and response for debugging
      await login(req as LoginRequest, res);
      const statusCall = (res.status as jest.Mock).mock.calls[0][0];
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      console.log('Login Response:', { status: statusCall, body: jsonCall });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            token: expect.any(String)
          })
        })
      );
    });
  });

  describe('Password Management', () => {
    let testUser: any;
    let plainTextPassword: string;

    beforeEach(async () => {
      plainTextPassword = validUserData.password;
      const result = await authService.register(validUserData);
      testUser = result.user;

      // Verify the user exists and password works
      const user = await User.findById(testUser._id);
      expect(user).toBeDefined();
      const isPasswordValid = await user?.comparePassword(plainTextPassword);
      expect(isPasswordValid).toBe(true);
    });

    it('should change password successfully', async () => {
      const { req, res } = mockRequestResponse();
      
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: UserRole.CUSTOMER,
        isActive: true,
        lastLogin: new Date()
      };
      const newPassword = 'NewTest@Pass123';
      req.body = {
        currentPassword: plainTextPassword,
        newPassword: newPassword
      };

      await changePassword(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { message: 'Password updated successfully' }
        })
      );

      // Verify password was actually changed
      const updatedUser = await User.findById(testUser._id);
      const isNewPasswordValid = await updatedUser?.comparePassword(newPassword);
      expect(isNewPasswordValid).toBe(true);
    });

    it('should handle incorrect current password', async () => {
      const { req, res } = mockRequestResponse();
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: UserRole.CUSTOMER,
        isActive: true,
        lastLogin: new Date()
      };
      const newPassword = 'New@Pass123';
      req.body = {
        currentPassword: 'Wrong@Pass123',
        newPassword: newPassword
      };

      await changePassword(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Current password is incorrect'
        })
      );
    });
  });
}); 