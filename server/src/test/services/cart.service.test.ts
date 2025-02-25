import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { authService } from '../../services/auth.service';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';
import { IUser } from '../../types/models/user.types';
import { IProduct } from '../../types/models/product.types';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { ICartDocument } from '../../types/models/cart.types';

describe('Cart Service Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: IUser & { _id: mongoose.Types.ObjectId };
  let testProduct: IProduct & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();

    // Create test user
    const { user } = await authService.register({
      email: 'test@example.com',
      password: 'Test@123',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890'
    });
    testUser = user as IUser & { _id: mongoose.Types.ObjectId };

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

  describe('getCart', () => {
    it('should create a new cart for user if none exists', async () => {
      const cart = await CartService.getCart(testUser._id.toString());
      
      expect(cart).toBeDefined();
      expect(cart.user.toString()).toBe(testUser._id.toString());
      expect(cart.items).toHaveLength(0);
      expect(cart.subtotal).toBe(0);
    });

    it('should return existing cart for user', async () => {
      const cart1: ICartDocument = await CartService.getCart(testUser._id.toString());
      const cart2: ICartDocument = await CartService.getCart(testUser._id.toString());
      
      expect(cart2._id.toString()).toBe(cart1._id.toString());
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const cart = await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        2,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].product.toString()).toBe(testProduct._id.toString());
    });

    it('should update quantity for existing item', async () => {
      await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        2,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      const cart = await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        3,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('should throw error for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      await expect(CartService.addItem(
        testUser._id.toString(),
        fakeId,
        1,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      )).rejects.toThrow(NotFoundError);
    });

    it('should throw error for invalid variant', async () => {
      await expect(CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        1,
        {
          size: 'XL',
          color: 'Red',
          sku: 'INVALID-SKU'
        }
      )).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        2,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      const cart = await CartService.updateItemQuantity(
        testUser._id.toString(),
        testProduct._id.toString(),
        'TEST-SKB-001-M-BLK',
        3
      );

      expect(cart.items[0].quantity).toBe(3);
    });

    it('should remove item when quantity is 0', async () => {
      await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        2,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      const cart = await CartService.updateItemQuantity(
        testUser._id.toString(),
        testProduct._id.toString(),
        'TEST-SKB-001-M-BLK',
        0
      );

      expect(cart.items).toHaveLength(0);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        2,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      const cart = await CartService.removeItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        'TEST-SKB-001-M-BLK'
      );

      expect(cart.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      await CartService.addItem(
        testUser._id.toString(),
        testProduct._id.toString(),
        2,
        {
          size: 'M',
          color: 'Black',
          sku: 'TEST-SKB-001-M-BLK'
        }
      );

      const cart = await CartService.clearCart(testUser._id.toString());
      
      expect(cart.items).toHaveLength(0);
      expect(cart.subtotal).toBe(0);
    });
  });
}); 