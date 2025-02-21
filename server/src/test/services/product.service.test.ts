/**
 * Product Service Unit Tests
 * Tests the core business logic of product management.
 * 
 * Test Categories:
 * 1. Product Creation
 *    - Basic product creation
 *    - Validation of required fields
 *    - Duplicate handling (names, SKUs)
 * 
 * 2. Product Retrieval
 *    - Single product lookup
 *    - Pagination handling
 *    - Empty result sets
 * 
 * 3. Product Updates
 *    - Basic updates
 *    - Stock management
 *    - Non-existent products
 * 
 * 4. Product Deletion
 *    - Soft deletion
 *    - Non-existent products
 *    - Deleted product visibility
 * 
 * 5. Product Search
 *    - Text search
 *    - Category filtering
 *    - Price range filtering
 *    - Combined criteria
 * 
 * Features Tested:
 * - Data validation
 * - Business rules
 * - Error handling
 * - Edge cases
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ProductService } from '../../services/product.service';
import Product from '../../models/product';
import { IProduct } from '../../types/models/product.types';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';
import { CreateProductInput } from '../../types/services/product.service.types';

describe('Product Service Tests', () => {
  let mongoServer: MongoMemoryServer;

  // Test environment setup
  // Initializes in-memory MongoDB and creates text search index
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create text index for search
    await Product.collection.createIndex({ name: 'text', description: 'text' });
  });

  // Test environment cleanup
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Reset database before each test
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  // Sample product data for testing
  const validProductData: CreateProductInput = {
    name: 'Test Skateboard',
    description: 'A high-quality skateboard for testing',
    basePrice: 120.99,
    category: ProductCategory.COMPLETE_SKATEBOARD,
    brand: ProductBrand.ELEMENT,
    sku: 'TEST-SKB-001',
    stock: 10,
    variations: [],
    images: ['https://example.com/test-image-1.jpg', 'https://example.com/test-image-2.jpg'],
    isActive: true,
    tags: ['test', 'skateboard']
  };

  // Product Creation Tests
  // Tests basic creation, validation, and duplicate handling
  describe('Product Creation', () => {
    // Test basic product creation functionality
    it('should create a new product successfully', async () => {
      const product = await ProductService.createProduct(validProductData);

      expect(product).toBeDefined();
      expect(product.name).toBe(validProductData.name);
      expect(product.basePrice).toBe(validProductData.basePrice);
      expect(product._id).toBeDefined();
    });

    // Test validation of required fields
    it('should validate required fields', async () => {
      const invalidProduct = { ...validProductData };
      delete (invalidProduct as any).name;

      await expect(ProductService.createProduct(invalidProduct))
        .rejects
        .toThrow('Product validation failed');
    });

    // Test duplicate product handling
    it('should handle duplicate product names', async () => {
      await ProductService.createProduct(validProductData);
      
      await expect(ProductService.createProduct(validProductData))
        .rejects
        .toThrow('Product with this name already exists');
    });
  });

  // Product Retrieval Tests
  // Tests fetching single products and paginated lists
  describe('Product Retrieval', () => {
    let testProduct: IProduct;

    // Create test product for retrieval tests
    beforeEach(async () => {
      testProduct = await ProductService.createProduct(validProductData);
    });

    // Test single product retrieval
    it('should get product by id', async () => {
      const product = await ProductService.getProductById(testProduct._id.toString());

      expect(product).toBeDefined();
      expect(product?.name).toBe(validProductData.name);
    });

    // Test handling of non-existent products
    it('should return null for non-existent product id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const product = await ProductService.getProductById(nonExistentId);

      expect(product).toBeNull();
    });

    // Test pagination functionality
    it('should get all products with pagination', async () => {
      // Create additional products
      await ProductService.createProduct({
        ...validProductData,
        name: 'Test Skateboard 2',
        sku: 'TEST-SKB-002'
      });

      const { products, total } = await ProductService.getProducts(1, 10);

      expect(products).toHaveLength(2);
      expect(total).toBe(2);
    });

    // Test empty result handling
    it('should handle empty result set', async () => {
      await Product.deleteMany({});

      const { products, total } = await ProductService.getProducts(1, 10);

      expect(products).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  // Product Update Tests
  // Tests modification of existing products
  describe('Product Update', () => {
    let testProduct: IProduct;

    // Create test product for update operations
    beforeEach(async () => {
      testProduct = await ProductService.createProduct(validProductData);
    });

    // Test basic update functionality
    it('should update product successfully', async () => {
      const updates = {
        name: 'Updated Skateboard',
        basePrice: 129.99
      };

      const updatedProduct = await ProductService.updateProduct(
        testProduct._id.toString(),
        updates
      );

      expect(updatedProduct).toBeDefined();
      expect(updatedProduct?.name).toBe(updates.name);
      expect(updatedProduct?.basePrice).toBe(updates.basePrice);
      expect(updatedProduct?.category).toBe(validProductData.category);
    });

    // Test non-existent product updates
    it('should return null when updating non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updates = { name: 'Updated Name' };

      const result = await ProductService.updateProduct(nonExistentId, updates);

      expect(result).toBeNull();
    });

    // Test stock management
    it('should handle stock updates', async () => {
      const updates = { stock: 5 };

      const updatedProduct = await ProductService.updateProduct(
        testProduct._id.toString(),
        updates
      );

      expect(updatedProduct?.stock).toBe(5);
    });
  });

  // Product Deletion Tests
  // Tests soft deletion and visibility rules
  describe('Product Deletion', () => {
    let testProduct: IProduct;

    // Create test product for deletion
    beforeEach(async () => {
      testProduct = await ProductService.createProduct(validProductData);
    });

    it('should soft delete product successfully', async () => {
      const result = await ProductService.deleteProduct(testProduct._id.toString());

      expect(result).toBe(true);

      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct?.isActive).toBe(false);
    });

    it('should return false when deleting non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await ProductService.deleteProduct(nonExistentId);

      expect(result).toBe(false);
    });

    it('should not return deleted products in general queries', async () => {
      await ProductService.deleteProduct(testProduct._id.toString());

      const { products, total } = await ProductService.getProducts(1, 10);

      expect(products).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  // Product Search Tests
  // Tests search functionality and filtering
  describe('Product Search', () => {
    // Create test products for search operations
    beforeEach(async () => {
      // Create multiple products for search testing
      await Promise.all([
        ProductService.createProduct({
          ...validProductData,
          name: 'Test Skateboard',
          sku: 'TEST-SKB-001',
          basePrice: 199.99,
          category: ProductCategory.COMPLETE_SKATEBOARD
        }),
        ProductService.createProduct({
          ...validProductData,
          name: 'Pro Skateboard',
          sku: 'TEST-SKB-002',
          basePrice: 149.99,
          category: ProductCategory.DECK
        }),
        ProductService.createProduct({
          ...validProductData,
          name: 'Beginner Board',
          sku: 'TEST-SKB-003',
          basePrice: 79.99,
          category: ProductCategory.COMPLETE_SKATEBOARD
        })
      ]);
    });

    it('should search products by text', async () => {
      const { products, total } = await ProductService.searchProducts('Pro', 1, 10);

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Pro Skateboard');
      expect(total).toBe(1);
    });

    it('should filter products by category', async () => {
      const { products, total } = await ProductService.getProducts(1, 10, {
        category: ProductCategory.DECK
      });

      expect(products).toHaveLength(1);
      expect(products[0].category).toBe(ProductCategory.DECK);
      expect(total).toBe(1);
    });

    it('should filter products by price range', async () => {
      const { products, total } = await ProductService.getProducts(1, 10, {
        minPrice: 100,
        maxPrice: 150
      });

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Pro Skateboard');
      expect(products[0].basePrice).toBe(149.99);
      expect(total).toBe(1);
    });

    it('should combine multiple search criteria', async () => {
      const { products, total } = await ProductService.getProducts(1, 10, {
        maxPrice: 100,
        category: ProductCategory.COMPLETE_SKATEBOARD,
        isActive: true
      });

      expect(total).toBe(1);
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Beginner Board');
      expect(products[0].basePrice).toBeLessThanOrEqual(100);
      expect(products[0].category).toBe(ProductCategory.COMPLETE_SKATEBOARD);
    });

    it('should handle no results', async () => {
      const { products, total } = await ProductService.searchProducts('NonExistent', 1, 10);

      expect(products).toHaveLength(0);
      expect(total).toBe(0);
    });
  });
}); 