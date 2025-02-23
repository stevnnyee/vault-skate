import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { authService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';
import { IUser } from '../../types/models/user.types';
import { IProduct } from '../../types/models/product.types';
import Cart from '../../models/cart';

describe('Cart Routes Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: IUser & { _id: mongoose.Types.ObjectId };
  let testProduct: IProduct & { _id: mongoose.Types.ObjectId };
  let authToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await Cart.deleteMany({});

    // Create test user and get auth token
    const { user, token } = await authService.register({
      email: 'test@example.com',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890'
    });
    testUser = user as IUser & { _id: mongoose.Types.ObjectId };
    authToken = token;

    // Create test product
    testProduct = await ProductService.createProduct({
      name: 'Test Skateboard',
      description: 'A test skateboard',
      basePrice: 99.99,
      category: ProductCategory.COMPLETE_SKATEBOARD,
      brand: ProductBrand.ELEMENT,
      sku: 'TEST-SKB-001',
      stock: 10,
      variations: [{
        size: 'M',
        color: 'Black',
        sku: 'TEST-SKB-001-M-BLK',
        stockQuantity: 5,
        additionalPrice: 0
      }],
      images: ['https://example.com/test.jpg'],
      isActive: true
    }) as IProduct & { _id: mongoose.Types.ObjectId };
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.subtotal).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/cart');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(2);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          // Missing quantity and variant
        });

      expect(response.status).toBe(400);
    });

    it('should handle invalid product ID', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: new mongoose.Types.ObjectId().toString(),
          quantity: 1,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Product not found');
    });

    it('should handle insufficient stock', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 10, // More than available stock (5)
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient stock');
    });

    it('should validate total quantity when adding to existing item', async () => {
      // First add 3 items
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 3,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });

      // Try to add 3 more (total would exceed stock of 5)
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 3,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient stock');
    });
  });

  describe('PUT /api/cart/items', () => {
    beforeEach(async () => {
      // Add item to cart before testing updates
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });
    });

    it('should update item quantity', async () => {
      const response = await request(app)
        .put('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          variantSku: 'TEST-SKB-001-M-BLK',
          quantity: 3
        });

      expect(response.status).toBe(200);
      expect(response.body.data.items[0].quantity).toBe(3);
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          variantSku: 'TEST-SKB-001-M-BLK',
          quantity: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should validate stock when updating quantity', async () => {
      const response = await request(app)
        .put('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          variantSku: 'TEST-SKB-001-M-BLK',
          quantity: 6 // More than available stock (5)
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient stock');
    });
  });

  describe('DELETE /api/cart/items', () => {
    beforeEach(async () => {
      // Add item to cart before testing deletion
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 1,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          variantSku: 'TEST-SKB-001-M-BLK'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/cart', () => {
    beforeEach(async () => {
      // Add items to cart before testing clear
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2,
          variant: {
            size: 'M',
            color: 'Black',
            sku: 'TEST-SKB-001-M-BLK'
          }
        });
    });

    it('should clear all items from cart', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.subtotal).toBe(0);
    });
  });
}); 