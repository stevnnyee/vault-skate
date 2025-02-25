// src/test/models/cart.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Cart from '../../models/cart';

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
 * Removes all carts from the test database after each test
 */
beforeEach(async () => {
  await Cart.deleteMany({});
});

/**
 * Cart Model Tests
 * Tests the functionality of the Cart schema including:
 * - Cart creation
 * - Item management
 * - Total calculation
 */
describe('Cart Model Test', () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockProductId = new mongoose.Types.ObjectId();

  // Valid test cart data
  const validCartData = {
    user: mockUserId,
    items: [{
      product: mockProductId,
      variation: 'DECK-001',
      quantity: 1,
      price: 59.99
    }],
    totalAmount: 59.99
  };

  /**
   * Test case: Successful cart creation
   * Verifies that a cart can be created with items
   */
  it('should create & save cart successfully', async () => {
    const validCart = new Cart(validCartData);
    const savedCart = await validCart.save();
    
    expect(savedCart._id).toBeDefined();
    expect(savedCart.items).toHaveLength(1);
    expect(savedCart.totalAmount).toBe(59.99);
  });

  // Add more test cases here as needed
});