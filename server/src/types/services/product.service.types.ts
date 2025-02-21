/**
 * Product Service Type Definitions
 * Contains all TypeScript interfaces used by the product service.
 * 
 * Type Categories:
 * 1. Input Types:
 *    - Product creation
 *    - Product updates
 *    - Query filters
 * 
 * 2. Response Types:
 *    - Single product responses
 *    - Product list responses
 *    - Pagination results
 * 
 * 3. Query Types:
 *    - Filter options
 *    - Sort options
 *    - Search parameters
 */

import { IProduct, ProductCategory, ProductBrand, IProductVariation } from '../models/product.types';

/**
 * Product Creation Input
 * Required data for creating a new product
 * Omits system-generated fields from base product interface
 */
export interface CreateProductInput extends Omit<IProduct, '_id' | 'createdAt' | 'updatedAt' | 'ratings' | 'reviews'> {
  name: string;
  description: string;
  basePrice: number;
  category: ProductCategory;
  brand: ProductBrand;
  sku: string;
  stock: number;
  variations: IProductVariation[];
  images: string[];
  isActive: boolean;
  tags?: string[];
}

/**
 * Product Update Input
 * Partial version of creation input for updates
 * All fields are optional since updates can be partial
 */
export interface UpdateProductInput extends Partial<CreateProductInput> {}

/**
 * Product Query Filters
 * Basic filter criteria for product listings
 * Used for filtering products by various attributes
 */
export interface ProductQueryFilters {
  category?: ProductCategory;
  brand?: ProductBrand;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  tags?: string[];
}

/**
 * Extended Query Options
 * Combines basic filters with additional query parameters
 * Includes pagination, sorting, and search options
 */
export interface ProductQueryOptions extends ProductQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Pagination Result
 * Standard response format for paginated product queries
 * Includes result set and pagination metadata
 */
export interface ProductPaginationResult {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Single Product Response
 * Standard response format for single product operations
 * Used for create, update, and get single product
 */
export interface ProductResponse {
  success: boolean;
  message: string;
  data?: {
    product: IProduct;
  };
  error?: string;
}

/**
 * Product List Response
 * Standard response format for product list operations
 * Used for get products list and search operations
 */
export interface ProductListResponse {
  success: boolean;
  message: string;
  data?: {
    products: IProduct[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}