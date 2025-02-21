/**
 * Product Creation Controller
 * Handles the creation of new products in the system.
 * 
 * Authentication:
 * - Requires authentication
 * - Limited to users with ADMIN role
 * 
 * Request Processing:
 * - Validates admin privileges
 * - Processes product creation through ProductService
 * - Returns newly created product data
 * 
 * Error Handling:
 * - Returns 403 for unauthorized access
 * - Returns 400 for validation errors
 * - Includes detailed error messages
 */

import { Response } from 'express';
import { CreateProductRequest } from '../../types/controllers/product.controller.types';
import { ProductService } from '../../services/product.service';
import { UserRole } from '../../types/models/user.types';

export const createProduct = async (req: CreateProductRequest, res: Response) => {
  try {
    // Check for admin role
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    // Create product using service
    const product = await ProductService.createProduct(req.body);
    
    // Return success response with created product
    return res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    // Handle and format error response
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product'
    });
  }
};