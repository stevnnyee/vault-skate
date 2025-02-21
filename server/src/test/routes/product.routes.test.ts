/**
 * Product Routes Integration Tests
 * Tests all product-related API endpoints and their functionality.
 * 
 * Test Categories:
 * 1. Product Listing & Filtering
 * 2. Product Details Retrieval
 * 3. Product Creation (Admin only)
 * 4. Product Updates (Admin only)
 * 5. Product Deletion (Admin only)
 * 6. Product Search
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
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import productRoutes from '../../routes/product.routes';
import authRoutes from '../../routes/auth.routes';
import User from '../../models/user';
import Product from '../../models/product';
import { UserRole } from '../../types/models/user.types';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';

// Main test suite for product routes
// Tests all API endpoints for product management
describe('Product Routes Tests', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let adminToken: string;
  let customerToken: string;

  // Test environment setup
  // Creates in-memory MongoDB instance and configures Express app
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);

    process.env.JWT_SECRET = 'test-secret';
  });

  // Test environment cleanup
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Reset test data before each test
  // Creates fresh admin and customer users with tokens
  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user and get token
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'Admin@Pass123',
        role: UserRole.ADMIN
      });

    if (!adminResponse.body.data?.token) {
      console.log('Admin registration response:', adminResponse.body);
      throw new Error('Failed to get admin token');
    }
    adminToken = adminResponse.body.data.token;

    // Create customer user and get token
    const customerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Customer',
        lastName: 'User',
        email: 'customer@test.com',
        password: 'Customer@Pass123',
        role: UserRole.CUSTOMER
      });

    if (!customerResponse.body.data?.token) {
      console.log('Customer registration response:', customerResponse.body);
      throw new Error('Failed to get customer token');
    }
    customerToken = customerResponse.body.data.token;

    // Create text index for product search
    await Product.collection.createIndex({ name: 'text', description: 'text' });
  });

  // Sample product data for testing
  const validProductData = {
    name: 'Test Skateboard',
    description: 'A high-quality skateboard for testing',
    basePrice: 99.99,
    category: ProductCategory.COMPLETE_SKATEBOARD,
    brand: ProductBrand.ELEMENT,
    sku: 'TEST-SKB-001',
    stock: 10,
    variations: [],
    images: ['https://example.com/image1.jpg'],
    isActive: true,
    tags: ['test', 'skateboard']
  };

  // Product listing and filtering tests
  // Tests GET / endpoint with various query parameters
  describe('GET /', () => {
    // Setup test products before each test
    beforeEach(async () => {
      // Create some test products
      await Product.create([
        {
          ...validProductData,
          sku: 'TEST-SKB-001'
        },
        {
          ...validProductData,
          name: 'Pro Skateboard',
          sku: 'TEST-SKB-002',
          basePrice: 149.99,
          category: ProductCategory.DECK
        }
      ]);
    });

    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: ProductCategory.DECK });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].category).toBe(ProductCategory.DECK);
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 100, maxPrice: 200 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].basePrice).toBe(149.99);
    });
  });

  // Product detail retrieval tests
  // Tests GET /:id endpoint for individual products
  describe('GET /:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        ...validProductData,
        sku: 'TEST-SKB-003'
      });
    });

    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(validProductData.name);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });

  // Product creation tests
  // Tests POST / endpoint with different authentication scenarios
  describe('POST /', () => {
    it('should create product when admin authenticated', async () => {
      const newProduct = {
        name: 'New Test Board',
        description: 'A new test skateboard',
        basePrice: 99.99,
        category: ProductCategory.COMPLETE_SKATEBOARD,
        brand: ProductBrand.ELEMENT,
        sku: 'TEST-NEW-001',
        stock: 10,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-VAR-001',
          stockQuantity: 5,
          additionalPrice: 0
        }],
        images: ['https://example.com/test.jpg'],
        isActive: true,
        tags: ['test', 'skateboard']
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      // Log response for debugging
      console.log('Response:', response.body);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newProduct.name);
    });

    it('should fail when not authenticated', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProductData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should fail when authenticated as customer', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validProductData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  // Product update tests
  // Tests PUT /:id endpoint for modifying existing products
  describe('PUT /:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Board',
        description: 'A test skateboard',
        basePrice: 99.99,
        category: ProductCategory.COMPLETE_SKATEBOARD,
        brand: ProductBrand.ELEMENT,
        sku: 'TEST-UPD-001',
        stock: 10,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-VAR-001',
          stockQuantity: 5,
          additionalPrice: 0
        }],
        images: ['https://example.com/test.jpg'],
        isActive: true
      });
    });

    it('should update product when admin authenticated', async () => {
      const updates = {
        name: 'Updated Test Board',
        basePrice: 129.99,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-VAR-002',
          stockQuantity: 5,
          additionalPrice: 0
        }]
      };

      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.basePrice).toBe(updates.basePrice);
    });

    it('should fail when not authenticated', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should fail when authenticated as customer', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  // Product deletion tests
  // Tests DELETE /:id endpoint with soft deletion
  describe('DELETE /:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        ...validProductData,
        sku: 'TEST-SKB-006'
      });
    });

    it('should delete product when admin authenticated', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify product is marked as inactive
      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct?.isActive).toBe(false);
    });

    it('should fail when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should fail when authenticated as customer', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  // Product search tests
  // Tests GET /search endpoint with text search functionality
  describe('GET /search', () => {
    // Setup test products for search
    beforeEach(async () => {
      await Product.create([
        {
          ...validProductData,
          sku: 'TEST-SKB-007'
        },
        {
          ...validProductData,
          name: 'Pro Skateboard',
          sku: 'TEST-SKB-008',
          basePrice: 149.99,
          category: ProductCategory.DECK
        },
        {
          ...validProductData,
          name: 'Beginner Board',
          sku: 'TEST-SKB-009',
          basePrice: 79.99
        }
      ]);
    });

    it('should search products by text', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ search: 'Pro' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Pro Skateboard');
    });

    it('should handle no search results', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ search: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });
  });
});

// Cart functionality tests (placeholder)
describe('Cart Controller Tests', () => {
  // ... existing code ...
}); 