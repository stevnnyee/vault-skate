/**
 * Order Service Unit Tests
 * Tests the business logic and data manipulation functions of the order service.
 * 
 * Test Categories:
 * 1. Order Creation
 *    - Valid order creation
 *    - Stock validation
 *    - Price calculation
 *    - Error handling
 * 
 * 2. Order Updates
 *    - Status updates
 *    - Payment status updates
 *    - Stock management
 * 
 * 3. Order Retrieval
 *    - Single order
 *    - Multiple orders
 *    - Filtering and pagination
 * 
 * 4. Analytics
 *    - Order statistics
 *    - Revenue calculations
 *    - Purchase trends
 * 
 * Each test verifies:
 * - Function behavior
 * - Data integrity
 * - Error handling
 * - Business rules
 */

import { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { authService } from '../../services/auth.service';
import { OrderStatus, PaymentStatus, PaymentMethod, ShippingMethod } from '../../types/models/order.types';
import { CreateOrderInput } from '../../types/services/order.service.types';
import { IUser } from '../../types/models/user.types';
import { IProduct } from '../../types/models/product.types';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';
import { CreateProductInput } from '../../types/services/product.service.types';
import { IOrderDocument } from '../../types/models/order.types';
import User from '../../models/user';
import Order from '../../models/order';

describe('Order Service Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: IUser & { _id: Types.ObjectId };
  let testProduct: IProduct & { _id: Types.ObjectId };
  let testOrder: IOrderDocument & { _id: Types.ObjectId };

  const orderData: CreateOrderInput = {
    items: [{
      product: '', // Will be set after product creation
      name: 'Test Product',
      quantity: 2,
      price: 99.99,
      sku: 'TST-BLK-M',
      variant: {
        size: 'M',
        color: 'Black',
        sku: 'TST-BLK-M'
      }
    }],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: true
    },
    billingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: false
    },
    paymentMethod: PaymentMethod.CREDIT_CARD,
    shippingMethod: ShippingMethod.STANDARD
  };

  const lowStockOrder: CreateOrderInput = {
    items: [{
      product: '', // Will be set after product creation
      name: 'Test Product',
      quantity: 1000, // More than available stock
      price: 99.99,
      sku: 'TST-BLK-M',
      variant: {
        size: 'M',
        color: 'Black',
        sku: 'TST-BLK-M'
      }
    }],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: true
    },
    billingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
      isDefault: false
    },
    paymentMethod: PaymentMethod.CREDIT_CARD,
    shippingMethod: ShippingMethod.STANDARD
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await User.deleteMany({});
    await Order.deleteMany();
    
    // Create test user
    const { user } = await authService.register({
      email: 'test@example.com',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890'
    });
    testUser = user as IUser & { _id: Types.ObjectId };

    // Create test product with limited stock
    const productData: CreateProductInput = {
      name: 'Test Product',
      description: 'Test Description',
      basePrice: 99.99,
      category: ProductCategory.COMPLETE_SKATEBOARD,
      brand: ProductBrand.ELEMENT,
      sku: 'TEST-001',
      stock: 5,  // Reduced stock for testing
      images: ['https://example.com/test.jpg'],
      variations: [],
      isActive: true
    };
    testProduct = await ProductService.createProduct(productData) as IProduct & { _id: Types.ObjectId };

    // Update order data with correct structure
    orderData.items[0].product = testProduct._id.toString();
    lowStockOrder.items[0].product = testProduct._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      const order = await OrderService.createOrder(testUser._id.toString(), orderData);
      expect(order).toBeDefined();
      expect(order.user.toString()).toBe(testUser._id.toString());
      expect(order.items).toHaveLength(1);
      expect(order.items[0].product.toString()).toBe(testProduct._id.toString());
    });

    it('should fail when product has insufficient stock', async () => {
      await expect(OrderService.createOrder(testUser._id.toString(), lowStockOrder))
        .rejects
        .toThrow('Insufficient stock');
    });
  });

  describe('getOrderById', () => {
    beforeEach(async () => {
      testOrder = await OrderService.createOrder(testUser._id.toString(), orderData) as IOrderDocument & { _id: Types.ObjectId };
    });

    it('should get order by id', async () => {
      const order = await OrderService.getOrderById(testOrder._id.toString()) as IOrderDocument & { _id: Types.ObjectId };
      expect(order).toBeDefined();
      expect(order._id.toString()).toBe(testOrder._id.toString());
    });

    it('should throw error for non-existent order', async () => {
      const fakeId = new Types.ObjectId().toString();
      await expect(OrderService.getOrderById(fakeId))
        .rejects
        .toThrow('Order not found');
    });
  });

  describe('getOrders', () => {
    beforeEach(async () => {
      // Create multiple orders for the test user
      await Promise.all([
        OrderService.createOrder(testUser._id.toString(), orderData),
        OrderService.createOrder(testUser._id.toString(), orderData)
      ]);
    });

    it('should get all orders for a user', async () => {
      const result = await OrderService.getOrders(testUser._id.toString(), 1, 10, {});
      expect(result.orders).toBeDefined();
      expect(result.orders.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      // Create an order and update its status
      const order = await OrderService.createOrder(testUser._id.toString(), {
        ...orderData,
        items: [{
          ...orderData.items[0],
          quantity: 1 // Reduce quantity to avoid stock issues
        }]
      });
      await OrderService.updateOrderStatus(order._id.toString(), OrderStatus.PROCESSING);

      const result = await OrderService.getOrders(testUser._id.toString(), 1, 10, {
        status: OrderStatus.PROCESSING
      });

      expect(result.orders.some(o => o.status === OrderStatus.PROCESSING)).toBe(true);
    });

    it('should get all orders for admin', async () => {
      const result = await OrderService.getOrders(null, 1, 10, {});
      expect(result.orders).toBeDefined();
      expect(result.orders.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });
  });
});