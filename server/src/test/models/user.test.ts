// src/test/models/user.test.ts
import mongoose, { Error as MongooseError } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/user';
import { UserRole, IUser, AuthProvider } from '../../types/models/user.types';

// Define IUserDocument interface
interface IUserDocument extends Omit<IUser, '_id'>, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
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
    password: 'TestPass123!',
    role: UserRole.CUSTOMER,
    addresses: [{
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: true,
      label: 'Home'
    }],
    preferences: {
      language: 'en',
      currency: 'USD',
      notifications: {
        email: true,
        sms: false
      }
    },
    isActive: true,
    isEmailVerified: false,
    failedLoginAttempts: 0,
    dateOfBirth: undefined as Date | undefined,
    authProvider: AuthProvider.LOCAL as AuthProvider | undefined,
    refreshToken: undefined as string | undefined
  });

  describe('User Creation', () => {
    it('should create & save user successfully', async () => {
      const userData = generateUniqueUserData();
      const plainTextPassword = userData.password;
      const validUser = new User(userData);
      const savedUser = await validUser.save();
      
      // Basic field validation
      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(plainTextPassword);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.isEmailVerified).toBe(false);
      
      // Preferences validation
      expect(savedUser.preferences).toBeDefined();
      const preferences = savedUser.preferences;
      if (preferences) {
        expect(preferences.language).toBe('en');
        expect(preferences.currency).toBe('USD');
        const notifications = preferences.notifications;
        if (notifications) {
          expect(notifications.email).toBe(true);
          expect(notifications.sms).toBe(false);
        }
      }
      
      // Timestamps validation
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

  describe('Address Management', () => {
    it('should handle multiple addresses', async () => {
      const userData = generateUniqueUserData();
      const secondAddress = {
        street: '456 Test Ave',
        city: 'Test City 2',
        state: 'TS',
        zipCode: '67890',
        country: 'Test Country',
        isDefault: false,
        label: 'Work'
      };
      userData.addresses.push(secondAddress);

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.addresses).toHaveLength(2);
      expect(savedUser.addresses[1].label).toBe('Work');
      expect(savedUser.addresses[0].isDefault).toBe(true);
      expect(savedUser.addresses[1].isDefault).toBe(false);
    });

    it('should require all address fields', async () => {
      const userData = generateUniqueUserData();
      const invalidAddress = {
        street: '123 Test St',
        // Missing city
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      };
      userData.addresses = [invalidAddress as any];

      const user = new User(userData);
      let err: any;
      try {
        await user.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(MongooseError.ValidationError);
      expect(err.errors['addresses.0.city']).toBeDefined();
    });
  });

  describe('User Preferences', () => {
    it('should set default preferences for new users', async () => {
      const userData = generateUniqueUserData();
      userData.preferences = undefined as any;

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.preferences.language).toBe('en');
      expect(savedUser.preferences.currency).toBe('USD');
      expect(savedUser.preferences.notifications.email).toBe(true);
      expect(savedUser.preferences.notifications.sms).toBe(false);
    });

    it('should allow updating preferences', async () => {
      const userData = generateUniqueUserData('_prefs');
      const user = new User(userData);
      const savedUser = await user.save();

      savedUser.preferences.language = 'es';
      savedUser.preferences.currency = 'EUR';
      savedUser.preferences.notifications.sms = true;
      const updatedUser = await savedUser.save();

      expect(updatedUser.preferences.language).toBe('es');
      expect(updatedUser.preferences.currency).toBe('EUR');
      expect(updatedUser.preferences.notifications.sms).toBe(true);
    });
  });

  describe('Account Security', () => {
    it('should track failed login attempts', async () => {
      const userData = generateUniqueUserData('_security');
      const user = new User(userData);
      const savedUser = await user.save();

      savedUser.failedLoginAttempts = 3;
      const updatedUser = await savedUser.save();

      expect(updatedUser.failedLoginAttempts).toBe(3);
    });

    it('should handle account lockout', async () => {
      const userData = generateUniqueUserData('_lockout');
      const user = new User(userData);
      const savedUser = await user.save();

      const lockoutDate = new Date();
      savedUser.failedLoginAttempts = 5;
      savedUser.lockoutUntil = lockoutDate;
      const updatedUser = await savedUser.save();

      expect(updatedUser.lockoutUntil).toEqual(lockoutDate);
      expect(updatedUser.failedLoginAttempts).toBe(5);
    });
  });

  describe('Date Fields', () => {
    it('should handle date of birth', async () => {
      const userData = generateUniqueUserData();
      const dob = new Date('1990-01-01');
      userData.dateOfBirth = dob;

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.dateOfBirth).toEqual(dob);
    });

    it('should track last login and password change', async () => {
      const userData = generateUniqueUserData('_dates');
      const user = new User(userData);
      const savedUser = await user.save();

      const loginDate = new Date();
      const passwordChangeDate = new Date();
      
      savedUser.lastLogin = loginDate;
      savedUser.lastPasswordChange = passwordChangeDate;
      const updatedUser = await savedUser.save();

      expect(updatedUser.lastLogin).toEqual(loginDate);
      expect(updatedUser.lastPasswordChange).toEqual(passwordChangeDate);
    });
  });

  describe('Document Transformation', () => {
    it('should transform _id to id in toObject', async () => {
      const userData = generateUniqueUserData();
      const user = new User(userData);
      const savedUser = await user.save();
      const userObject = savedUser.toObject();

      expect(userObject.id).toBeDefined();
      expect(userObject._id).toBeDefined();
      expect(userObject.id).toBe(userObject._id.toString());
    });
  });

  describe('Email Verification', () => {
    it('should default to unverified email', async () => {
      const userData = generateUniqueUserData();
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.isEmailVerified).toBe(false);
    });

    it('should allow marking email as verified', async () => {
      const userData = generateUniqueUserData('_verify');
      const user = new User(userData);
      const savedUser = await user.save();

      savedUser.isEmailVerified = true;
      const updatedUser = await savedUser.save();

      expect(updatedUser.isEmailVerified).toBe(true);
    });
  });

  describe('Authentication Provider', () => {
    it('should handle different auth providers', async () => {
      const userData = generateUniqueUserData('_provider');
      userData.authProvider = AuthProvider.GOOGLE;
      
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.authProvider).toBe(AuthProvider.GOOGLE);
    });

    it('should store refresh tokens', async () => {
      const userData = generateUniqueUserData('_token');
      const user = new User(userData);
      const savedUser = await user.save();

      const refreshToken = 'test-refresh-token';
      savedUser.refreshToken = refreshToken;
      const updatedUser = await savedUser.save();

      expect(updatedUser.refreshToken).toBe(refreshToken);
    });
  });
});