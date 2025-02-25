/**
 * Authentication Routes Integration Tests
 * Tests the complete request/response cycle for auth endpoints
 * Uses supertest to simulate HTTP requests
 */

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from '../../routes/auth.routes';
import User from '../../models/user';
import { UserRole } from '../../types/models/user.types';
import { AuthenticatedRequest } from '../../types/controllers/auth.controller.types';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { AuthProvider } from '../../types/models/user.types';

describe('Auth Routes Tests', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let authToken: string;

  /**
   * Global Test Setup
   * - Initializes MongoDB Memory Server
   * - Sets up Express application
   * - Configures middleware and routes
   * - Sets test environment variables
   */
  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-secret';
  });

  /**
   * Global Test Teardown
   * Cleanup database connections and servers
   */
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  /**
   * Test Data Reset
   * Clears user collection before each test
   */
  beforeEach(async () => {
    await User.deleteMany({});
  });

  const validUserData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Test@Pass123',
    role: UserRole.CUSTOMER,
    authProvider: AuthProvider.LOCAL
  };

  describe('POST /register', () => {
    /**
     * Test successful registration
     * Verifies:
     * - 201 status code
     * - User creation in database
     * - JWT token generation
     * - Response format
     */
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          email: validUserData.email,
          password: validUserData.password,
          role: validUserData.role
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail registration with invalid data', async () => {
      const invalidData = { 
        ...validUserData,
        email: 'invalid-email',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * Test duplicate email handling
     * Verifies:
     * - Proper error handling
     * - Database constraint enforcement
     * - Error response format
     */
    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          email: validUserData.email,
          password: validUserData.password,
          role: validUserData.role
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          email: validUserData.email,
          password: validUserData.password,
          role: validUserData.role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          email: validUserData.email,
          password: validUserData.password,
          role: validUserData.role
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);

      // Save token for protected route tests
      authToken = response.body.data.token;
    });

    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'Wrong@Pass123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    beforeEach(async () => {
      // Register and login before each test
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          email: validUserData.email,
          password: validUserData.password,
          role: validUserData.role
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        });

      authToken = loginResponse.body.data.token;
    });

    describe('GET /profile', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(validUserData.email);
      });

      it('should fail without auth token', async () => {
        const response = await request(app)
          .get('/api/auth/profile');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Authentication required');
      });
    });

    describe('PUT /profile', () => {
      it('should update user profile', async () => {
        const updates = {
          firstName: 'Jane',
          lastName: 'Smith'
        };

        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe(updates.firstName);
        expect(response.body.data.lastName).toBe(updates.lastName);
      });
    });

    describe('POST /address', () => {
      it('should add new address', async () => {
        const address = {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
          isDefault: true
        };

        const response = await request(app)
          .post('/api/auth/address')
          .set('Authorization', `Bearer ${authToken}`)
          .send(address);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.addresses).toHaveLength(1);
        expect(response.body.data.addresses[0]).toMatchObject(address);
      });
    });

    describe('DELETE /address/:addressId', () => {
      it('should remove address', async () => {
        // First add an address
        const address = {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
          isDefault: true
        };

        await request(app)
          .post('/api/auth/address')
          .set('Authorization', `Bearer ${authToken}`)
          .send(address);

        const response = await request(app)
          .delete('/api/auth/address/0')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.addresses).toHaveLength(0);
      });

      it('should fail without auth token', async () => {
        const response = await request(app)
          .delete('/api/auth/address/0');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Authentication required');
      });

      it('should fail with invalid address index', async () => {
        const response = await request(app)
          .delete('/api/auth/address/999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid address index');
      });
    });

    describe('POST /change-password', () => {
      it('should change password successfully', async () => {
        const passwordData = {
          currentPassword: validUserData.password,
          newPassword: 'New@Pass123'
        };

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify can login with new password
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: validUserData.email,
            password: passwordData.newPassword
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
      });

      it('should fail with incorrect current password', async () => {
        const passwordData = {
          currentPassword: 'Wrong@Pass123',
          newPassword: 'New@Pass123'
        };

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Current password is incorrect');
      });
    });
  });
}); 