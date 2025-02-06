// src/test/models/cart.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Cart from '../../models/cart';

/**
 * Cart Model Tests
 * Tests the functionality of the Cart schema including:
 * - Cart creation
 * - Item management
 * - Total calculation
 */
describe('Cart Model Test', () => {
    // Clean up carts before each test
    beforeEach(async () => {
      await Cart.deleteMany({});
    });
  
    /**
     * Test case: Successful cart creation
     * Verifies that a cart can be created with items
     */
    it('should create & save cart successfully', async () => {
      // Create a valid cart object
      const validCart = new Cart({
        user: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          variation: 'DECK-001',
          quantity: 1,
          price: 59.99
        }],
        totalAmount: 59.99
      });
  
      // Save and verify the cart
      const savedCart = await validCart.save();
      
      expect(savedCart._id).toBeDefined();
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.totalAmount).toBe(59.99);
    });
  });