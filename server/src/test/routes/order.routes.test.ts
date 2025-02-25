/**
 * Order Routes Integration Tests
 * Tests all order-related API endpoints and their functionality.
 * 
 * Test Categories:
 * 1. Order Creation
 *    - Valid order creation
 *    - Invalid data handling
 *    - Authentication checks
 * 
 * 2. Order Management (Admin)
 *    - Status updates
 *    - Payment status updates
 *    - Authorization checks
 * 
 * 3. Order Retrieval
 *    - Single order access
 *    - Order listing
 *    - Pagination and filtering
 * 
 * 4. Order History & Analytics
 *    - History retrieval
 *    - Analytics access
 *    - Purchase trends
 * 
 * Authentication Scenarios:
 * - Unauthenticated requests
 * - Customer authenticated requests
 * - Admin authenticated requests
 * 
 * Each test verifies:
 * - HTTP status codes
 * - Response structure
 * - Data validation
 * - Authorization rules
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app';
import { OrderStatus, PaymentMethod, ShippingMethod } from '../../types/models/order.types';
import { UserRole } from '../../types/models/user.types';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';
import User from '../../models/user';
import Product from '../../models/product';
import Order from '../../models/order';
import { authService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';

describe('Order Routes Tests', () => {
  let mongoServer: MongoMemoryServer;
  let customerToken: string;
  let adminToken: string;
  let otherUserToken: string;
  let testUser: any;
  let adminUser: any;
  let otherUser: any;
  let testProduct: any;
  let testOrder: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Create test users
    const customerResult = await authService.register({
      email: 'customer@test.com',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'Customer',
      role: UserRole.CUSTOMER
    });
    testUser = customerResult.user;
    customerToken = customerResult.token;

    const adminResult = await authService.register({
      email: 'admin@test.com',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'Admin',
      role: UserRole.ADMIN
    });
    adminUser = adminResult.user;
    adminToken = adminResult.token;

    const otherUserResult = await authService.register({
      email: 'other@test.com',
      password: 'Test@123',
      firstName: 'Other',
      lastName: 'User',
      role: UserRole.CUSTOMER
    });
    otherUser = otherUserResult.user;
    otherUserToken = otherUserResult.token;

    // Create test product
    testProduct = await ProductService.createProduct({
      name: 'Test Product',
      description: 'Test Description',
      basePrice: 99.99,
      category: ProductCategory.COMPLETE_SKATEBOARD,
      brand: ProductBrand.ELEMENT,
      sku: 'TEST-001',
      stock: 10,
      images: ['https://example.com/test.jpg'],
      isActive: true,
      variations: []  // Add required variations field
    });

    // Create test order
    const orderData = {
      items: [{
        product: testProduct._id,
        name: testProduct.name,
        quantity: 1,
        price: testProduct.basePrice,
        sku: testProduct.sku,
        variant: {
          size: 'M',
          color: 'Black',
          sku: testProduct.sku
        }
      }],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      },
      paymentMethod: PaymentMethod.CREDIT_CARD,
      shippingMethod: ShippingMethod.STANDARD
    };

    testOrder = await OrderService.createOrder(testUser._id.toString(), orderData);
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      items: [{
        product: '',  // Will be set in the test
        name: 'Test Product',
        quantity: 1,
        price: 99.99,
        sku: 'TEST-001',
        variant: {
          size: 'M',
          color: 'Black',
          sku: 'TEST-001'
        }
      }],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true
      },
      paymentMethod: PaymentMethod.CREDIT_CARD,
      shippingMethod: ShippingMethod.STANDARD
    };

    it('should create a new order for authenticated user', async () => {
      validOrderData.items[0].product = testProduct._id.toString();

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should reject order creation without authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send(validOrderData);

      expect(response.status).toBe(401);
    });

    it('should validate required order fields', async () => {
      const invalidData = { items: [] };
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should allow admin to update order status', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PROCESSING });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(OrderStatus.PROCESSING);
    });

    it('should prevent non-admin from updating order status', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: OrderStatus.PROCESSING });

      expect(response.status).toBe(403);
    });

    it('should validate order status value', async () => {
      const response = await request(app)
        .patch(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should allow user to get their own order', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(testOrder._id.toString());
    });

    it('should allow admin to get any order', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent user from accessing other users orders', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create additional test orders
      const orderData = {
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          quantity: 1,
          price: testProduct.basePrice,
          sku: testProduct.sku,
          variant: {
            size: 'M',
            color: 'Black',
            sku: testProduct.sku
          }
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
          isDefault: true
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
          isDefault: true
        },
        paymentMethod: PaymentMethod.CREDIT_CARD,
        shippingMethod: ShippingMethod.STANDARD
      };

      await OrderService.createOrder(testUser._id.toString(), orderData);
      await OrderService.createOrder(testUser._id.toString(), orderData);
    });

    it('should get user orders with pagination', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.page).toBe(1);
    });

    it('should filter orders by status', async () => {
      // Update one order's status
      await OrderService.updateOrderStatus(testOrder._id.toString(), OrderStatus.PROCESSING);

      const response = await request(app)
        .get('/api/orders?status=PROCESSING')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders.some((order: any) => order.status === OrderStatus.PROCESSING)).toBe(true);
    });

    it('should allow admin to get all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders/history', () => {
    it('should return order history for user', async () => {
      const response = await request(app)
        .get('/api/orders/history')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orders.length).toBeGreaterThan(0);
    });

    it('should filter history by date range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get(`/api/orders/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/orders/analytics', () => {
    it('should allow admin to access analytics', async () => {
      const response = await request(app)
        .get('/api/orders/analytics?timeframe=month')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should prevent non-admin from accessing analytics', async () => {
      const response = await request(app)
        .get('/api/orders/analytics?timeframe=month')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });
}); 