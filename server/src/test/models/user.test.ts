// src/test/models/user.test.ts
import mongoose, { Error as MongooseError } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/user';
import { UserRole, IUser } from '../../types/user.types';

// Define IUserDocument interface
interface IUserDocument extends Omit<IUser, '_id'>, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Add interface for static methods
interface UserModel extends mongoose.Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

let mongoServer: MongoMemoryServer;

/**
 * Test suite setup
 * Initializes an in-memory MongoDB server for testing
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

/**
 * Test suite cleanup
 * Disconnects from test database and stops MongoDB server
 */
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

/**
 * Individual test cleanup
 * Removes all users from the test database after each test
 */
beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Model Test Suite', () => {
  // Helper function to generate unique test data
  const generateUniqueUserData = (suffix: string = '') => ({
    firstName: 'John',
    lastName: 'Doe',
    email: `john.doe${suffix}@example.com`,
    password: 'Password123!',
    role: UserRole.CUSTOMER,
    addresses: [{
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    }]
  });

  describe('User Creation', () => {
    it('should create & save user successfully', async () => {
      const userData = generateUniqueUserData();
      const plainTextPassword = userData.password;
      const validUser = new User(userData);
      const savedUser = await validUser.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(validUser.firstName);
      expect(savedUser.email).toBe(validUser.email);
      expect(savedUser.password).not.toBe(plainTextPassword);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should fail to save user without required fields', async () => {
      const userWithoutRequired = new User({});
      let err: any;
      try {
        await userWithoutRequired.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(MongooseError.ValidationError);
      expect(err.errors.firstName).toBeDefined();
      expect(err.errors.lastName).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    });
  });

  describe('Email Validation', () => {
    it('should fail to save user with invalid email format', async () => {
      const userWithInvalidEmail = new User({
        ...generateUniqueUserData(),
        email: 'invalid-email'
      });
      
      let err: any;
      try {
        await userWithInvalidEmail.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(MongooseError.ValidationError);
      expect(err.errors.email).toBeDefined();
    });

    it('should fail to save duplicate email', async () => {
      const userData = generateUniqueUserData('_duplicate');
      await new User(userData).save();
      
      const duplicateUser = new User(userData);
      let err: any;
      try {
        await duplicateUser.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000);
    });
  });

  describe('Password Management', () => {
    it('should hash password before saving', async () => {
      const userData = generateUniqueUserData();
      const plainTextPassword = userData.password;
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.password).not.toBe(plainTextPassword);
      expect(savedUser.password).toHaveLength(60);
    });

    it('should correctly compare passwords', async () => {
      const userData = generateUniqueUserData();
      const plainTextPassword = userData.password;
      const user = new User(userData);
      await user.save();
      
      const validPassword = await user.comparePassword(plainTextPassword);
      const invalidPassword = await user.comparePassword('wrongpassword');
      
      expect(validPassword).toBe(true);
      expect(invalidPassword).toBe(false);
    });

    it('should fail to save password that does not meet requirements', async () => {
      const userWithWeakPassword = new User({
        ...generateUniqueUserData(),
        password: 'weak'
      });
      
      let err: any;
      try {
        await userWithWeakPassword.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(MongooseError.ValidationError);
      expect(err.errors.password).toBeDefined();
    });
  });

  describe('Phone Number Validation', () => {
    it('should save valid phone numbers', async () => {
      const validPhoneNumbers = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '1234567890'
      ];

      for (let i = 0; i < validPhoneNumbers.length; i++) {
        const userData = generateUniqueUserData(`_phone_${i}`);
        const user = new User({
          ...userData,
          phoneNumber: validPhoneNumbers[i]
        });
        const savedUser = await user.save();
        expect(savedUser.phoneNumber).toBe(validPhoneNumbers[i]);
      }
    });

    it('should fail to save invalid phone numbers', async () => {
      const invalidPhoneNumbers = [
        'abc',
        '123',
        '+12',
        'not-a-number'
      ];

      for (let i = 0; i < invalidPhoneNumbers.length; i++) {
        const userData = generateUniqueUserData(`_invalid_phone_${i}`);
        const user = new User({
          ...userData,
          phoneNumber: invalidPhoneNumbers[i]
        });
        
        let err: any;
        try {
          await user.save();
        } catch (error) {
          err = error;
        }
        expect(err).toBeInstanceOf(MongooseError.ValidationError);
        expect(err.errors.phoneNumber).toBeDefined();
      }
    });
  });

  describe('Profile Picture URL Validation', () => {
    it('should save valid image URLs', async () => {
      const validUrls = [
        'http://example.com/image.jpg',
        'https://example.com/image.png',
        'https://example.com/image.gif',
        'https://example.com/image.webp'
      ];

      for (let i = 0; i < validUrls.length; i++) {
        const userData = generateUniqueUserData(`_url_${i}`);
        const user = new User({
          ...userData,
          profilePicture: validUrls[i]
        });
        const savedUser = await user.save();
        expect(savedUser.profilePicture).toBe(validUrls[i]);
      }
    });

    it('should fail to save invalid image URLs', async () => {
      const invalidUrls = [
        'not-a-url',
        'http://example.com/image.txt',
        'ftp://example.com/image.jpg'
      ];

      for (let i = 0; i < invalidUrls.length; i++) {
        const userData = generateUniqueUserData(`_invalid_url_${i}`);
        const user = new User({
          ...userData,
          profilePicture: invalidUrls[i]
        });
        
        let err: any;
        try {
          await user.save();
        } catch (error) {
          err = error;
        }
        expect(err).toBeInstanceOf(MongooseError.ValidationError);
        expect(err.errors.profilePicture).toBeDefined();
      }
    });
  });

  describe('Static Methods', () => {
    it('should find user by email', async () => {
      await new User(generateUniqueUserData()).save();
      
      const foundUser = await (User as UserModel).findByEmail(generateUniqueUserData().email);
      expect(foundUser).toBeDefined();
      expect(foundUser!.email).toBe(generateUniqueUserData().email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await (User as UserModel).findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });
});