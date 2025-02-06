// src/test/models/product.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Product from '../../models/product';
import { ProductCategory, ProductBrand } from '../../types/product.types';
import slugify from 'slugify';

/**
 * Product Model Tests
 * Tests the functionality of the Product schema including:
 * - Product creation
 * - Validation rules
 * - Required fields
 * - Custom methods
 */
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
 * Removes all products from the test database after each test
 */
afterEach(async () => {
  await Product.deleteMany({});
});

describe('Product Schema Tests', () => {
  // Sample valid product data for testing
  const validProductData = {
    name: 'Pro Skateboard Complete',
    description: 'Professional grade complete skateboard',
    category: ProductCategory.COMPLETE_SKATEBOARD,
    brand: ProductBrand.ELEMENT,
    basePrice: 129.99,
    variations: [{
      size: '8.0"',
      color: 'Black',
      sku: 'ELEM-PRO-8-BLK',
      stockQuantity: 10,
      additionalPrice: 0
    }],
    images: ['https://example.com/image.jpg'],
    isActive: true
  };

  describe('Validation Tests', () => {
    /**
     * Tests basic product creation with valid data
     * Verifies all required fields are properly saved
     */
    test('should validate a correct product', async () => {
      const validProduct = new Product(validProductData);
      const savedProduct = await validProduct.save();
      
      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(validProductData.name);
      expect(savedProduct.isActive).toBe(true);
    });

    /**
     * Tests validation error when required fields are missing
     * Should fail when trying to save an incomplete product
     */
    test('should fail validation when required fields are missing', async () => {
      const invalidProduct = new Product({
        name: 'Test Product'
      });

      await expect(invalidProduct.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    /**
     * Tests validation of SKU requirement in variations
     * Ensures each variation has a unique SKU
     */
    test('should require SKU for variations', async () => {
      const productWithInvalidVariation = new Product({
        ...validProductData,
        variations: [{
          size: '8.0"',
          color: 'Black',
          stockQuantity: 10,
          additionalPrice: 0
          // Missing SKU
        }]
      });

      await expect(productWithInvalidVariation.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    /**
     * Tests image URL validation
     * Ensures all image URLs are properly formatted
     */
    test('should validate image URLs', async () => {
      const productWithInvalidImage = new Product({
        ...validProductData,
        images: ['not-a-valid-url']
      });

      await expect(productWithInvalidImage.save()).rejects.toThrow('Invalid image URL');
    });
  });

  describe('Price Validation Tests', () => {
    /**
     * Tests base price validation
     * Ensures base price cannot be negative
     */
    test('should not allow negative base price', async () => {
      const productWithNegativePrice = new Product({
        ...validProductData,
        basePrice: -10
      });

      await expect(productWithNegativePrice.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    /**
     * Tests sale price validation
     * Ensures sale price cannot be negative
     */
    test('should not allow negative sale price', async () => {
      const productWithNegativeSalePrice = new Product({
        ...validProductData,
        basePrice: 100,
        salePrice: -50
      });

      await expect(productWithNegativeSalePrice.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    /**
     * Tests variation additional price validation
     * Ensures additional price defaults to 0 when not specified
     */
    test('should default additional price to 0', async () => {
      const product = new Product({
        ...validProductData,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-SKU-1',
          stockQuantity: 10
          // additionalPrice not specified
        }]
      });

      const savedProduct = await product.save();
      expect(savedProduct.variations[0].additionalPrice).toBe(0);
    });

    /**
     * Tests validation of negative additional price
     * Additional price can be negative (e.g., for discounted variations)
     * but total price (basePrice + additionalPrice) should not be negative
     */
    test('should allow negative additional price but prevent negative total price', async () => {
      const productWithNegativeAdditional = new Product({
        ...validProductData,
        basePrice: 100,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-SKU-1',
          stockQuantity: 10,
          additionalPrice: -101 // Would make total price negative
        }]
      });

      await expect(productWithNegativeAdditional.save()).rejects.toThrow();
    });
  });

  describe('Variation Tests', () => {
    /**
     * Tests multiple variations handling
     * Verifies proper storage and retrieval of multiple variations
     */
    test('should handle multiple variations correctly', async () => {
      const productWithVariations = new Product({
        ...validProductData,
        basePrice: 129.99,
        variations: [
          {
            size: '8.0"',
            color: 'Black',
            sku: 'SKU-1',
            stockQuantity: 10,
            additionalPrice: 0
          },
          {
            size: '8.5"',
            color: 'Red',
            sku: 'SKU-2',
            stockQuantity: 5,
            additionalPrice: 10
          }
        ]
      });

      const savedProduct = await productWithVariations.save();
      expect(savedProduct.variations).toHaveLength(2);
      expect(savedProduct.variations[1].additionalPrice).toBe(10);
    });

    /**
     * Tests SKU uniqueness across variations
     * Ensures no duplicate SKUs within the same product
     */
    test('should ensure unique SKUs across variations', async () => {
      const productWithDuplicateSKUs = new Product({
        ...validProductData,
        variations: [
          {
            size: '8.0"',
            color: 'Black',
            sku: 'SAME-SKU',
            stockQuantity: 10,
            additionalPrice: 0
          },
          {
            size: '8.5"',
            color: 'Red',
            sku: 'SAME-SKU', // Duplicate SKU
            stockQuantity: 5,
            additionalPrice: 10
          }
        ]
      });

      await expect(productWithDuplicateSKUs.save()).rejects.toThrow();
    });

    /**
     * Tests stock quantity validation
     * Ensures stock quantity cannot be negative
     */
    test('should not allow negative stock quantity', async () => {
      const productWithNegativeStock = new Product({
        ...validProductData,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-SKU',
          stockQuantity: -1,
          additionalPrice: 0
        }]
      });

      await expect(productWithNegativeStock.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });
});

describe('Price Validation Tests', () => {
    // Sample valid product data for testing
    const validProductData = {
      name: 'Pro Skateboard Complete',
      description: 'Professional grade complete skateboard',
      category: ProductCategory.COMPLETE_SKATEBOARD,
      brand: ProductBrand.ELEMENT,
      basePrice: 129.99,
      variations: [{
        size: '8.0"',
        color: 'Black',
        sku: 'ELEM-PRO-8-BLK',
        stockQuantity: 10,
        additionalPrice: 0
      }],
      images: ['https://example.com/image.jpg'],
      isActive: true
    };
  
    /**
     * Tests base price validation
     * Ensures base price cannot be negative
     */
    test('should not allow negative base price', async () => {
      const productWithNegativePrice = new Product({
        ...validProductData,
        basePrice: -10
      });
  
      await expect(productWithNegativePrice.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  
    /**
     * Tests that variations with valid total prices are allowed
     */
    test('should allow variations with valid total prices', async () => {
      const product = new Product({
        ...validProductData,
        basePrice: 100,
        variations: [
          {
            size: '8.0"',
            color: 'Black',
            sku: 'TEST-SKU-1',
            stockQuantity: 10,
            additionalPrice: -50 // Total price would be 50 (still positive)
          }
        ]
      });
  
      const savedProduct = await product.save();
      expect(savedProduct.variations[0].additionalPrice).toBe(-50);
    });
  
    /**
     * Tests that variations with negative total prices are rejected
     */
    test('should reject variations with negative total prices', async () => {
      const product = new Product({
        ...validProductData,
        basePrice: 100,
        variations: [
          {
            size: '8.0"',
            color: 'Black',
            sku: 'TEST-SKU-1',
            stockQuantity: 10,
            additionalPrice: -110 // Would make total price -10
          }
        ]
      });
  
      await expect(product.save()).rejects.toThrow('Total price (base price + additional price) cannot be negative');
    });
  
    /**
     * Tests that multiple variations all validate their total prices
     */
    test('should validate total prices for all variations', async () => {
      const product = new Product({
        ...validProductData,
        basePrice: 100,
        variations: [
          {
            size: '8.0"',
            color: 'Black',
            sku: 'TEST-SKU-1',
            stockQuantity: 10,
            additionalPrice: -50 // Valid: total 50
          },
          {
            size: '8.5"',
            color: 'Red',
            sku: 'TEST-SKU-2',
            stockQuantity: 5,
            additionalPrice: -101 // Invalid: would make total -1
          }
        ]
      });
  
      await expect(product.save()).rejects.toThrow('Total price (base price + additional price) cannot be negative');
    });
  
    /**
     * Tests updating variation prices after initial save
     */
    test('should validate total prices when updating variations', async () => {
      // First create a valid product
      const product = new Product({
        ...validProductData,
        basePrice: 100,
        variations: [{
          size: '8.0"',
          color: 'Black',
          sku: 'TEST-SKU-1',
          stockQuantity: 10,
          additionalPrice: 0
        }]
      });
  
      const savedProduct = await product.save();
  
      // Try to update with invalid additional price
      savedProduct.variations[0].additionalPrice = -110; // Would make total price -10
      
      await expect(savedProduct.save()).rejects.toThrow('Total price (base price + additional price) cannot be negative');
    });
  });