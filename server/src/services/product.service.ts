/**
 * Product Service
 * Handles all business logic related to product management.
 * 
 * Core Functionalities:
 * 1. Product Management:
 *    - Creation and validation
 *    - Updates and modifications
 *    - Deletion and archiving
 *    - Inventory tracking
 * 
 * 2. Product Retrieval:
 *    - Single product lookup
 *    - Filtered product listings
 *    - Search functionality
 *    - Category-based filtering
 * 
 * 3. Inventory Management:
 *    - Stock level tracking
 *    - Low stock alerts
 *    - Variant management
 * 
 * Features:
 * - Pagination support for listings
 * - Advanced search capabilities
 * - Category and price filtering
 * - Image handling
 * - SKU management
 * - Rating calculations
 */

import Product, { IProductDocument } from '../models/product';
import { 
  CreateProductInput, 
  UpdateProductInput, 
  ProductQueryOptions,
  ProductPaginationResult,
  ProductQueryFilters
} from '../types/services/product.service.types';
import { IProduct } from '../types/models/product.types';
import { Types } from 'mongoose';
import { PAGINATION } from '../constants/config';

export class ProductService {
  /**
   * Creates a new product
   * Validates and stores product information
   * 
   * @param productData - Product creation input data
   * @returns Newly created product document
   * @throws Error if validation fails or duplicate SKU
   */
  static async createProduct(productData: CreateProductInput): Promise<IProduct> {
    try {
      // Check for duplicate name first
      const existingName = await Product.findOne({ name: productData.name });
      if (existingName) {
        throw new Error('Product with this name already exists');
      }

      // Then check for duplicate SKU
      const existingSku = await Product.findOne({ sku: productData.sku });
      if (existingSku) {
        throw new Error('SKU already exists');
      }

      const product = new Product({
        ...productData,
        ratings: { average: 0, count: 0 },
        reviews: []
      });
      const savedProduct = await product.save();
      return savedProduct.toObject() as IProduct;
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Error creating product');
    }
  }

  /**
   * Retrieves products with filtering and pagination
   * Supports various query filters and sorting options
   * 
   * @param page - Page number for pagination
   * @param limit - Items per page
   * @param filters - Query filters (category, price range, etc.)
   * @returns Paginated product results with total count
   */
  static async getProducts(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: ProductQueryFilters = {}
  ): Promise<{ products: IProduct[]; total: number }> {
    try {
      const query: any = { isActive: true };

      if (filters) {
        if (filters.category) {
          query.category = filters.category;
        }
        if (filters.brand) {
          query.brand = filters.brand;
        }
        if (filters.minPrice !== undefined) {
          query.basePrice = { $gte: filters.minPrice };
        }
        if (filters.maxPrice !== undefined) {
          query.basePrice = { ...query.basePrice || {}, $lte: filters.maxPrice };
        }
        if (filters.isActive !== undefined) {
          query.isActive = filters.isActive;
        }
      }

      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find(query).skip(skip).limit(limit),
        Product.countDocuments(query)
      ]);

      return {
        products: products.map(product => product.toObject()),
        total
      };
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Failed to retrieve products');
    }
  }

  /**
   * Retrieves a single product by ID
   * Includes all product details and variants
   * 
   * @param productId - Product ID to retrieve
   * @returns Product document or null if not found
   */
  static async getProductById(productId: string): Promise<IProduct | null> {
    const product = await Product.findById(productId);
    return product ? product.toObject() as IProduct : null;
  }

  /**
   * Updates an existing product
   * Handles partial updates and validates changes
   * 
   * @param productId - Product ID to update
   * @param updates - Updated product data
   * @returns Updated product document
   * @throws Error if product not found or validation fails
   */
  static async updateProduct(
    productId: string,
    updates: UpdateProductInput
  ): Promise<IProduct | null> {
    const product = await Product.findByIdAndUpdate(
      productId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return product ? product.toObject() as IProduct : null;
  }

  /**
   * Deletes a product
   * Supports soft deletion by marking as inactive
   * 
   * @param productId - Product ID to delete
   * @throws Error if product not found or in use
   */
  static async deleteProduct(productId: string): Promise<boolean> {
    const result = await Product.findByIdAndUpdate(
      productId,
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  /**
   * Searches products by text and filters
   * Supports full-text search across multiple fields
   * 
   * @param searchTerm - Text to search for
   * @param page - Page number for pagination
   * @param limit - Items per page
   * @returns Paginated search results
   */
  static async searchProducts(
    searchTerm: string,
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = {
      $text: { $search: searchTerm },
      isActive: true
    };

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ score: { $meta: 'textScore' } }),
      Product.countDocuments(query)
    ]);

    return {
      products: products.map(p => p.toObject() as IProduct),
      total
    };
  }

  /**
   * Adds or updates a product review
   * Recalculates average rating after review changes
   */
  async addReview(
    productId: string, 
    userId: string, 
    rating: number, 
    comment?: string
  ): Promise<IProduct> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if user already reviewed this product
      const existingReviewIndex = product.reviews?.findIndex(
        review => review.userId.toString() === userId
      );

      if (existingReviewIndex !== undefined && existingReviewIndex >= 0) {
        // Update existing review
        if (!product.reviews) {
          product.reviews = [];
        }
        product.reviews[existingReviewIndex].rating = rating;
        product.reviews[existingReviewIndex].comment = comment;
        product.reviews[existingReviewIndex].updatedAt = new Date();
      } else {
        // Add new review
        if (!product.reviews) {
          product.reviews = [];
        }
        product.reviews.push({
          userId: new Types.ObjectId(userId),
          rating,
          comment,
          createdAt: new Date()
        });
      }

      // Recalculate average rating
      product.calculateRating();
      await product.save();

      return product.toObject() as IProduct;
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Failed to add review');
    }
  }

  /**
   * Updates product stock quantity
   * Handles both increase and decrease of stock
   */
  async updateStock(productId: string, quantity: number): Promise<IProduct> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Ensure we don't go negative
      if (product.stock + quantity < 0) {
        throw new Error('Insufficient stock');
      }

      product.stock += quantity;
      await product.save();

      return product.toObject() as IProduct;
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error('Failed to update stock');
    }
  }
}

export const productService = new ProductService();