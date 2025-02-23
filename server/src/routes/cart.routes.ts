/**
 * Cart Routes
 * Defines all cart-related API endpoints
 * 
 * Routes:
 * - GET /: Get user's cart
 * - POST /items: Add item to cart
 * - PUT /items: Update cart item
 * - DELETE /items: Remove item from cart
 * - DELETE /: Clear cart
 * 
 * Authentication:
 * - All routes require authentication
 * - Uses JWT token validation
 * 
 * Validation:
 * - Request body validation for all write operations
 * - Product existence checking
 * - Variant validation
 */

import { Router, Request, Response } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation/cart.validation';
import {
  GetCartRequest,
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveFromCartRequest
} from '../types/controllers/cart.controller.types';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get(
  '/',
  (req: Request, res: Response) => getCart(req as GetCartRequest, res)
);

// Add item to cart
router.post(
  '/items',
  validate('addToCart'),
  (req: Request, res: Response) => addToCart(req as AddToCartRequest, res)
);

// Update cart item
router.put(
  '/items',
  validate('updateCartItem'),
  (req: Request, res: Response) => updateCartItem(req as UpdateCartItemRequest, res)
);

// Remove item from cart
router.delete(
  '/items',
  validate('removeFromCart'),
  (req: Request, res: Response) => removeFromCart(req as RemoveFromCartRequest, res)
);

// Clear cart
router.delete(
  '/',
  (req: Request, res: Response) => clearCart(req as GetCartRequest, res)
);

export default router;
