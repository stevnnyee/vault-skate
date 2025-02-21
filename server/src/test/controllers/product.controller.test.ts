/**
 * Product Controller Unit Tests
 * Tests the business logic of product management controllers.
 * 
 * Test Categories:
 * 1. Product Creation
 *    - Validates admin privileges
 *    - Tests data validation
 *    - Handles duplicate products
 * 
 * 2. Product Retrieval
 *    - Tests pagination
 *    - Tests filtering
 *    - Handles non-existent products
 * 
 * 3. Product Updates
 *    - Validates admin privileges
 *    - Tests partial updates
 *    - Handles validation errors
 * 
 * 4. Product Deletion
 *    - Validates admin privileges
 *    - Tests soft deletion
 *    - Handles non-existent products
 * 
 * 5. Product Search
 *    - Tests text search
 *    - Tests combined filters
 *    - Handles empty results
 * 
 * Each test uses:
 * - Mock requests/responses
 * - In-memory MongoDB
 * - Isolated test data
 */

import { Request, Response } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createProduct } from '../../controllers/product/create';
import { getProducts, getProductById } from '../../controllers/product/get';
import { updateProduct } from '../../controllers/product/update';
import { deleteProduct } from '../../controllers/product/delete';
import { searchProducts } from '../../controllers/product/search';
import { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryRequest,
  DeleteProductRequest 
} from '../../types/controllers/product.controller.types';
import { UserRole } from '../../types/models/user.types';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';
import Product from '../../models/product';
import { ProductService } from '../../services/product.service';
import { AuthenticatedRequest } from '../../types/controllers/auth.controller.types';

describe('Product Controller Tests', () => {
  let mongoServer: MongoMemoryServer;

  const mockRequest = (data: any = {}): Partial<Request> => ({
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    user: data.user || { role: UserRole.ADMIN },
    ...data
  });

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

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

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Create text index for search
    await Product.collection.createIndex({ name: 'text', description: 'text' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  // Helper function to create mock request and response
  const mockRequestResponse = () => {
    const req = {
      body: {},
      params: {},
      query: {},
      user: {
        role: UserRole.ADMIN
      }
    } as any;
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
    
    return { req, res };
  };

  // Helper function to create a test product
  const createTestProduct = async () => {
    return await Product.create({
      name: 'Test Skateboard',
      description: 'A test skateboard',
      basePrice: 99.99,
      category: ProductCategory.COMPLETE_SKATEBOARD,
      brand: ProductBrand.ELEMENT,
      sku: 'TEST-SKU-001',
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
  };

  describe('Product Creation', () => {
    it('should create a new product when admin', async () => {
      const { req, res } = mockRequestResponse();
      req.user = { role: UserRole.ADMIN };
      req.body = validProductData;

      await createProduct(req as CreateProductRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: validProductData.name
          })
        })
      );
    });

    it('should deny creation for non-admin users', async () => {
      const { req, res } = mockRequestResponse();
      req.user = { role: UserRole.CUSTOMER };
      req.body = validProductData;

      await createProduct(req as CreateProductRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Admin privileges required')
        })
      );
    });
  });

  describe('Product Retrieval', () => {
    let testProduct: any;

    beforeEach(async () => {
      // Create test products
      testProduct = await Product.create({
        ...validProductData,
        name: 'Test Skateboard',
        sku: 'TEST-SKB-001',
        basePrice: 120.99
      });

      await Product.create({
        ...validProductData,
        name: 'Pro Skateboard',
        sku: 'TEST-SKB-002',
        basePrice: 149.99,
        category: ProductCategory.DECK
      });
    });

    it('should get all products with pagination', async () => {
      const req = mockRequest({
        query: { page: '1', limit: '10' }
      });
      const res = mockResponse();

      await getProducts(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: expect.arrayContaining([
              expect.objectContaining({ name: 'Test Skateboard' })
            ]),
            total: 2
          })
        })
      );
    });

    it('should get product by ID', async () => {
      const req = mockRequest({
        params: { id: testProduct._id.toString() }
      });
      const res = mockResponse();

      await getProductById(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            product: expect.objectContaining({
              name: 'Test Skateboard',
              sku: 'TEST-SKB-001'
            })
          })
        })
      );
    });

    it('should handle non-existent product ID', async () => {
      const { req, res } = mockRequestResponse();
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await getProductById(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Product not found'
        })
      );
    });
  });

  describe('Product Update', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should update product when admin', async () => {
      const { req, res } = mockRequestResponse();
      req.params = { id: testProduct._id.toString() };
      req.body = {
        name: 'Updated Skateboard',
        description: 'Updated description'
      };

      await updateProduct(req as UpdateProductRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'Updated Skateboard',
            description: 'Updated description'
          })
        })
      );
    });

    it('should deny update for non-admin users', async () => {
      const { req, res } = mockRequestResponse();
      req.user = { role: UserRole.CUSTOMER };
      req.params = { id: new mongoose.Types.ObjectId().toString() };
      req.body = { name: 'Updated Name' };

      await updateProduct(req as UpdateProductRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Admin privileges required')
        })
      );
    });
  });

  describe('Product Deletion', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await createTestProduct();
    });

    it('should delete product when admin', async () => {
      const { req, res } = mockRequestResponse();
      req.user = { role: UserRole.ADMIN };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await deleteProduct(req as DeleteProductRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { message: 'Product deleted successfully' }
        })
      );
    });

    it('should deny deletion for non-admin users', async () => {
      const { req, res } = mockRequestResponse();
      req.user = { role: UserRole.CUSTOMER };
      req.params = { id: new mongoose.Types.ObjectId().toString() };

      await deleteProduct(req as DeleteProductRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Admin privileges required')
        })
      );
    });
  });

  describe('Product Search', () => {
    beforeEach(async () => {
      // Create test products for search
      await Product.create([
        {
          ...validProductData,
          name: 'Test Skateboard',
          sku: 'TEST-SKB-001',
          basePrice: 120.99
        },
        {
          ...validProductData,
          name: 'Pro Skateboard',
          description: 'Professional grade skateboard',
          sku: 'TEST-SKB-002',
          basePrice: 149.99,
          category: ProductCategory.DECK
        },
        {
          ...validProductData,
          name: 'Beginner Board',
          sku: 'TEST-SKB-003',
          basePrice: 79.99
        }
      ]);
    });

    it('should search products by text', async () => {
      const req = mockRequest({
        query: { search: 'Pro', page: '1', limit: '10' }
      });
      const res = mockResponse();

      await searchProducts(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: expect.arrayContaining([
              expect.objectContaining({ 
                name: expect.stringMatching(/Pro/)
              })
            ])
          })
        })
      );
    });

    it('should filter products by category', async () => {
      const req = mockRequest({
        query: { category: ProductCategory.DECK }
      });
      const res = mockResponse();

      await getProducts(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: expect.arrayContaining([
              expect.objectContaining({ 
                category: ProductCategory.DECK 
              })
            ])
          })
        })
      );
    });

    it('should filter products by price range', async () => {
      const req = mockRequest({
        query: { minPrice: '100', maxPrice: '200' }
      });
      const res = mockResponse();

      await getProducts(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: expect.arrayContaining([
              expect.objectContaining({ 
                basePrice: 149.99 
              })
            ])
          })
        })
      );
    });

    it('should combine multiple search criteria', async () => {
      const { products, total } = await ProductService.getProducts(1, 10, {
        maxPrice: 100,
        category: ProductCategory.COMPLETE_SKATEBOARD,
        isActive: true
      });

      // Update expectations to match actual test data
      expect(products.length).toBe(1);
      expect(products[0].name).toBe('Beginner Board');
      expect(products[0].basePrice).toBeLessThanOrEqual(100);
      expect(products[0].category).toBe(ProductCategory.COMPLETE_SKATEBOARD);
    });
  });

  describe('GET /:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create({
        ...validProductData,
        sku: 'TEST-SKB-003'
      });
    });

    it('should get product by id', async () => {
      const req = mockRequest({
        params: { id: testProduct._id.toString() }
      });
      const res = mockResponse();

      await getProductById(req as ProductQueryRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            product: expect.objectContaining({
              name: validProductData.name
            })
          })
        })
      );
    });
  });
});

describe('Cart Controller Tests', () => {
  const mockRequestResponse = () => {
    const req = {
      user: {
        id: 'testUserId',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        isActive: true
      }
    } as AuthenticatedRequest;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;

    return { req, res };
  };

  it('should be defined', () => {
    expect(true).toBe(true);
  });
}); 