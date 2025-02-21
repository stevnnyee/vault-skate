/**
 * Product Search Controller
 * Handles advanced product search and filtering operations.
 * 
 * Search Features:
 * - Full-text search across product fields
 * - Category-based filtering
 * - Price range filtering
 * - Inventory status filtering
 * - Pagination support
 * - Sorting options
 * 
 * Query Parameters:
 * - search: Search text for product name/description
 * - category: Filter by product category
 * - page: Page number for pagination
 * - limit: Items per page
 * 
 * Response Format:
 * - products: Array of matching products
 * - total: Total number of matching products
 * - page: Current page number
 * - limit: Items per page
 * 
 * Error Handling:
 * - Returns 400 for invalid query parameters
 * - Handles empty search results
 * - Validates pagination parameters
 */

import { Response } from 'express';
import { ProductQueryRequest } from '../../types/controllers/product.controller.types';
import { ProductService } from '../../services/product.service';
import { PAGINATION } from '../../constants/config';

export const searchProducts = async (req: ProductQueryRequest, res: Response) => {
  try {
    const {
      search = '',
      category,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    // Execute search with pagination
    const { products, total } = await ProductService.searchProducts(
      search.toString(),
      Number(page),
      Number(limit)
    );

    // Return paginated search results
    return res.status(200).json({
      success: true,
      data: {
        products,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    // Handle and format error response
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to search products'
    });
  }
};
