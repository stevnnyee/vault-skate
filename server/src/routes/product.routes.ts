/**
 * Product Routes
 * Defines all product-related API endpoints and their handlers.
 * 
 * Route Categories:
 * 1. Public Routes:
 *    - Product listing and search
 *    - Individual product details
 * 
 * 2. Protected Routes (Admin only):
 *    - Product creation
 *    - Product updates
 *    - Product deletion
 * 
 * Authentication:
 * - Public routes are accessible without authentication
 * - Protected routes require valid JWT token
 * - Admin privileges verified through middleware
 * 
 * Validation:
 * - Request validation using Joi schemas
 * - Separate validation for create and update operations
 * - Query parameter validation for listings
 */

import { Router } from 'express';
import { createProduct } from '../controllers/product/create';
import { getProducts, getProductById } from '../controllers/product/get';
import { updateProduct } from '../controllers/product/update';
import { deleteProduct } from '../controllers/product/delete';
import { searchProducts } from '../controllers/product/search';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { 
  validateCreateProduct, 
  validateUpdateProduct,
  validateQueryProducts 
} from '../middleware/validation/product.validation';
import { Request, Response } from 'express';
import { 
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryRequest,
  DeleteProductRequest 
} from '../types/controllers/product.controller.types';

const router = Router();

// Public routes - No authentication required
router.get(
  '/',
  validateQueryProducts,
  (req: Request, res: Response) => getProducts(req as ProductQueryRequest, res)
);

// Search endpoint with validation
router.get(
  '/search',
  validateQueryProducts,
  (req: Request, res: Response) => searchProducts(req as ProductQueryRequest, res)
);

router.get(
  '/:id',
  (req: Request, res: Response) => getProductById(req as ProductQueryRequest, res)
);

// Protected routes - Admin access only
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateCreateProduct,
  (req: Request, res: Response) => createProduct(req as CreateProductRequest, res)
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateUpdateProduct,
  (req: Request, res: Response) => updateProduct(req as UpdateProductRequest, res)
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  (req: Request, res: Response) => deleteProduct(req as DeleteProductRequest, res)
);

export default router;