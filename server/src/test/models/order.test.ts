// src/test/models/order.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Order from '../../models/order';
import User from '../../models/user';
import { OrderStatus, PaymentMethod } from '../../types/order.types';

/**
 * Order Model Tests
 * Tests the functionality of the Order schema including:
 * - Order creation
 * - Relationship with User model
 * - Status management
 * - Payment handling
 */
describe('Order Model Test', () => {
    // Clean up orders and users before each test
    beforeEach(async () => {
      await Order.deleteMany({});
      await User.deleteMany({});
    });
  
    /**
     * Test case: Successful order creation
     * Verifies that an order can be created with a valid user and items
     */
    it('should create & save order successfully', async () => {
      // First create a test user for the order
      const user = await new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      }).save();
  
      // Create a valid order object
      const validOrder = new Order({
        user: user._id,
        orderNumber: 'ORD-001',
        items: [{
          product: new mongoose.Types.ObjectId(), // Reference to a product
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
        paymentMethod: PaymentMethod.CREDIT_CARD
      });
  
      // Save and verify the order
      const savedOrder = await validOrder.save();
      
      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.status).toBe(OrderStatus.PENDING);
      expect(savedOrder.totalAmount).toBe(59.99);
    });
  });
