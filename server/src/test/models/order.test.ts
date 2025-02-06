// src/test/models/order.test.ts

/**
 * Order Model Test Suite
 * 
 * This test file verifies the functionality of both the Order model and its type system.
 * It includes tests for:
 * - Type validation and constraints
 * - CRUD operations
 * - Virtual fields
 * - Instance methods
 * - Static methods
 * - Business logic validation
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Order from '../../models/order';
import User from '../../models/user';
import { 
  OrderStatus, 
  PaymentMethod, 
  IOrderDocument 
} from '../../types/order.types';

/**
 * Mock Product Schema
 * Creating a simplified Product model for testing purposes
 */
const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String
  });
  
  const Product = mongoose.model('Product', ProductSchema);
  
  // MongoDB memory server instance used for testing
  let mongoServer: MongoMemoryServer;
  let orderCounter = 0;
  let testProduct: any; // Store the test product reference
  
  describe('Order System Test Suite', () => {
    let testUser: any;
    
    beforeAll(async () => {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  
    afterAll(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });
  
    beforeEach(async () => {
      // Clear all collections before each test
      await Promise.all([
        Order.deleteMany({}),
        User.deleteMany({}),
        Product.deleteMany({})
      ]);
      
      orderCounter = 0;
      
      // Create test user
      testUser = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      });
  
      // Create test product
      testProduct = await Product.create({
        name: 'Test Product',
        price: 59.99,
        description: 'Test Description'
      });
    });
  
    /**
     * Helper function to create mock order data
     * Now uses the actual test product ID
     */
    const createMockOrderData = () => {
      orderCounter++;
      return {
        user: testUser._id,
        orderNumber: `ORD-TEST-${Date.now()}-${orderCounter}`,
        items: [{
          product: testProduct._id, // Use the actual test product ID
          quantity: 1,
          price: 59.99,
          variation: {
            size: '8.0',
            sku: 'DECK-001'
          }
        }],
        totalAmount: 59.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentStatus: 'Unpaid'
      };
    };

  /**
   * Type System Tests
   * Verifies that the TypeScript types and enums work as expected
   */
  describe('Order Type System', () => {
    // Verify OrderStatus enum values
    it('should enforce OrderStatus enum values', () => {
      const validStatuses = Object.values(OrderStatus);
      expect(validStatuses).toContain('Pending');
      expect(validStatuses).toContain('Processing');
      expect(validStatuses).toContain('Shipped');
      expect(validStatuses).toContain('Delivered');
      expect(validStatuses).toContain('Cancelled');
    });

    // Verify PaymentMethod enum values
    it('should enforce PaymentMethod enum values', () => {
      const validMethods = Object.values(PaymentMethod);
      expect(validMethods).toContain('Credit Card');
      expect(validMethods).toContain('Debit Card');
      expect(validMethods).toContain('PayPal');
      expect(validMethods).toContain('Stripe');
    });

    // Verify SKU requirement in variations
    it('should require SKU in variation', async () => {
      const invalidOrder = new Order({
        ...createMockOrderData(),
        items: [{
          ...createMockOrderData().items[0],
          variation: {
            size: '8.0'
            // Missing SKU
          }
        }]
      });

      await expect(invalidOrder.save()).rejects.toThrow();
    });
  });

  /**
   * Order Creation and Validation Tests
   * Verifies the basic CRUD operations and validation rules
   */
  describe('Order Creation and Validation', () => {
    // Test successful order creation
    it('should create & save order successfully', async () => {
      const validOrder = new Order(createMockOrderData());
      const savedOrder = await validOrder.save();
      
      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.status).toBe(OrderStatus.PENDING);
      expect(savedOrder.paymentStatus).toBe('Unpaid');
      expect(savedOrder.totalAmount).toBe(59.99);
      expect(savedOrder.user.toString()).toBe(testUser._id.toString());
    });

    // Test address field requirements
    it('should require all address fields', async () => {
      const invalidOrder = new Order({
        ...createMockOrderData(),
        shippingAddress: {
          street: '123 Test St',
          // Missing required fields
        }
      });

      await expect(invalidOrder.save()).rejects.toThrow();
    });

    // Test quantity and price validation
    it('should enforce positive quantities and prices', async () => {
      const invalidOrder = new Order({
        ...createMockOrderData(),
        items: [{
          ...createMockOrderData().items[0],
          quantity: -1,
          price: -10
        }]
      });

      await expect(invalidOrder.save()).rejects.toThrow();
    });

    // Test order number uniqueness
    it('should generate unique order numbers', async () => {
      const order1 = new Order(createMockOrderData());
      const order2 = new Order(createMockOrderData());
      
      await order1.save();
      await order2.save();
      
      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });
  });

  /**
   * Order Methods and Virtuals Tests
   * Verifies the functionality of instance methods and virtual properties
   */
  describe('Order Methods and Virtuals', () => {
    // Test total amount formatting
    it('should calculate formatted total correctly', async () => {
      const order = new Order(createMockOrderData());
      await order.save();
      expect(order.formattedTotal).toBe('$59.99');
    });

    // Test shipping status tracking
    it('should track shipping status correctly', async () => {
      const order = new Order(createMockOrderData());
      await order.save();

      expect(order.isFullyShipped).toBe(false);
      
      await order.updateStatus(OrderStatus.SHIPPED);
      expect(order.isFullyShipped).toBe(true);
      expect(order.shippedDate).toBeDefined();
      
      await order.updateStatus(OrderStatus.DELIVERED);
      expect(order.isFullyShipped).toBe(true);
      expect(order.deliveredDate).toBeDefined();
    });

    // Test status transitions
    it('should handle status transitions correctly', async () => {
      const order = new Order(createMockOrderData());
      await order.save();

      await order.updateStatus(OrderStatus.PROCESSING);
      expect(order.status).toBe(OrderStatus.PROCESSING);

      await order.updateStatus(OrderStatus.SHIPPED);
      expect(order.status).toBe(OrderStatus.SHIPPED);
      expect(order.shippedDate).toBeDefined();

      await order.updateStatus(OrderStatus.DELIVERED);
      expect(order.status).toBe(OrderStatus.DELIVERED);
      expect(order.deliveredDate).toBeDefined();
    });
  });

/**
 * Static Methods Tests
 * Verifies the functionality of model static methods with proper population
 */
describe('Static Methods', () => {
    // Create test data before each test
    beforeEach(async () => {
      await Order.create([
        createMockOrderData(),
        { ...createMockOrderData(), status: OrderStatus.SHIPPED },
        { ...createMockOrderData(), status: OrderStatus.DELIVERED }
      ]);
    });
  
    // Test user order lookup
    it('should find orders by user with correct population', async () => {
      const userOrders = await Order.findByUser(testUser._id.toString());
      expect(userOrders).toHaveLength(3);
      expect(userOrders[0].user.toString()).toBe(testUser._id.toString());
      // Verify product population
      expect(userOrders[0].items[0].product).toBeDefined();
      expect(userOrders[0].items[0].product._id.toString()).toBe(testProduct._id.toString());
    });
  
    // Test status-based order lookup
    it('should find orders by status with correct population', async () => {
      const shippedOrders = await Order.findByStatus(OrderStatus.SHIPPED);
      expect(shippedOrders).toHaveLength(1);
      expect(shippedOrders[0].status).toBe(OrderStatus.SHIPPED);
    });
  
    // Test recent orders lookup with proper population
    it('should find recent orders with correct limit and population', async () => {
      const recentOrders = await Order.findRecentOrders(2);
      expect(recentOrders).toHaveLength(2);
      
      // Verify sort order
      const orderDates = recentOrders.map(order => order.orderDate);
      expect(orderDates[0].getTime()).toBeGreaterThanOrEqual(orderDates[1].getTime());
      
      // Verify product population
      expect(recentOrders[0].items[0].product).toBeDefined();
      expect(recentOrders[0].items[0].product._id.toString()).toBe(testProduct._id.toString());
    });
  });

  /**
   * Payment Processing Tests
   * Verifies payment-related functionality and validation
   */
  describe('Payment Processing', () => {
    // Test payment method validation
    it('should validate payment methods', async () => {
      const invalidOrder = new Order({
        ...createMockOrderData(),
        paymentMethod: 'InvalidMethod'
      });

      await expect(invalidOrder.save()).rejects.toThrow();
    });

    // Test payment status updates
    it('should handle payment status transitions', async () => {
      const order = new Order(createMockOrderData());
      await order.save();

      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        { paymentStatus: 'Paid' },
        { new: true }
      );

      expect(updatedOrder?.paymentStatus).toBe('Paid');
    });

    // Test payment status validation
    it('should prevent invalid payment status values', async () => {
      const order = new Order(createMockOrderData());
      await order.save();

      await expect(
        Order.findByIdAndUpdate(
          order._id,
          { paymentStatus: 'InvalidStatus' },
          { new: true, runValidators: true }
        )
      ).rejects.toThrow();
    });
  });
});