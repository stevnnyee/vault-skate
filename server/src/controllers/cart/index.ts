/**
 * Cart Controller
 * Handles cart-related HTTP requests
 * 
 * Features:
 * - Get user's cart
 * - Add items to cart
 * - Update item quantities
 * - Remove items from cart
 * - Clear cart
 */

import { Response } from 'express';
import { CartService } from '../../services/cart.service';
import {
  GetCartRequest,
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveFromCartRequest
} from '../../types/controllers/cart.controller.types';

/**
 * Get user's cart
 * Returns the current user's shopping cart
 */
export const getCart = async (req: GetCartRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const cart = await CartService.getCart(req.user.id);
    
    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cart'
    });
  }
};

/**
 * Add item to cart
 * Adds a new item or updates quantity if item exists
 */
export const addToCart = async (req: AddToCartRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { productId, quantity, variant } = req.body;
    
    const cart = await CartService.addItem(
      req.user.id,
      productId,
      quantity,
      variant
    );

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to cart'
    });
  }
};

/**
 * Update cart item
 * Updates the quantity of an item in the cart
 */
export const updateCartItem = async (req: UpdateCartItemRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { productId, variantSku, quantity } = req.body;
    
    const cart = await CartService.updateItemQuantity(
      req.user.id,
      productId,
      variantSku,
      quantity
    );

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cart item'
    });
  }
};

/**
 * Remove item from cart
 * Removes a specific item from the cart
 */
export const removeFromCart = async (req: RemoveFromCartRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { productId, variantSku } = req.body;
    
    const cart = await CartService.removeItem(
      req.user.id,
      productId,
      variantSku
    );

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item from cart'
    });
  }
};

/**
 * Clear cart
 * Removes all items from the cart
 */
export const clearCart = async (req: GetCartRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const cart = await CartService.clearCart(req.user.id);

    return res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cart'
    });
  }
}; 