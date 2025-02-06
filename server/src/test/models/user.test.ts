// src/test/models/user.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/user';
import { UserRole } from '../../types/user.types';

/**
 * User Model Tests
 * Tests the functionality of the User schema including:
 * - User creation
 * - Password hashing
 * - Email validation
 * - Role management
 */
describe('User Model Test', () => {
    // Clean up users before each test
    beforeEach(async () => {
      await User.deleteMany({});
    });
  
    /**
     * Test case: Successful user creation
     * Verifies that a user can be created and password is hashed
     */
    it('should create & save user successfully', async () => {
      // Create a valid user object
      const validUser = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
        addresses: [{
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        }]
      });
  
      // Save and verify the user
      const savedUser = await validUser.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('john@example.com');
      // Verify password is hashed
      expect(savedUser.password).not.toBe('password123');
    });
  
    /**
     * Test case: Invalid email validation
     * Verifies that a user cannot be created with an invalid email
     */
    it('should fail to save user with invalid email', async () => {
      const userWithInvalidEmail = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email', // This should trigger validation error
        password: 'password123'
      });
  
      // Attempt to save and expect an error
      let err;
      try {
        await userWithInvalidEmail.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });
  });