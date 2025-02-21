/**
 * Product Deletion Controller
 * Handles the removal of existing products from the system.
 * 
 * Authentication:
 * - Requires authentication
 * - Limited to users with ADMIN role
 * - Verifies user permissions before deletion
 * 
 * Request Processing:
 * - Validates product existence
 * - Checks for active orders containing the product
 * - Handles soft deletion (marks as inactive) vs hard deletion
 * - Updates related inventory records
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the product to delete
 * 
 * Error Handling:
 * - Returns 403 for unauthorized access
 * - Returns 404 if product not found
 * - Returns 400 if product cannot be deleted (active orders)
 * - Includes specific error messages for troubleshooting
 */

import { Response } from 'express';
import { DeleteProductRequest } from '../../types/controllers/product.controller.types';
import { ProductService } from '../../services/product.service';
import { UserRole } from '../../types/models/user.types';

export const deleteProduct = async (req: DeleteProductRequest, res: Response) => {
  try {
    // Check for admin role
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }

    const { id } = req.params;

    // Attempt product deletion
    await ProductService.deleteProduct(id);

    // Return success response
    return res.status(200).json({
      success: true,
      data: { message: 'Product deleted successfully' }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product'
    });
  }
};
