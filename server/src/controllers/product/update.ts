/**
 * Product Update Controller
 * Handles modifications to existing products in the system.
 * 
 * Authentication:
 * - Requires authentication
 * - Limited to users with ADMIN role
 * - Verifies user permissions before update
 * 
 * Update Operations:
 * - Basic product details (name, description, price)
 * - Inventory management
 * - Category assignment
 * - Image management
 * - Product status (active/inactive)
 * - Variant updates
 * 
 * Validation:
 * - Validates all required fields
 * - Ensures price is positive
 * - Validates category existence
 * - Checks image file types and sizes
 * - Verifies SKU uniqueness
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the product to update
 * - updateData: Object containing fields to update
 * 
 * Error Handling:
 * - Returns 403 for unauthorized access
 * - Returns 404 if product not found
 * - Returns 400 for validation errors
 * - Includes detailed error messages
 */

import { Response } from 'express';
import { UpdateProductRequest } from '../../types/controllers/product.controller.types';
import { ProductService } from '../../services/product.service';
import { UserRole } from '../../types/models/user.types';

export const updateProduct = async (req: UpdateProductRequest, res: Response) => {
  try {
    // Check for admin role
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Validate and update product
    const updatedProduct = await ProductService.updateProduct(id, updateData);

    // Handle product not found
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Return success response with updated product
    return res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product'
    });
  }
};
