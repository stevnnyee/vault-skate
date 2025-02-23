/**
 * Cart Validation Middleware
 * Validates cart-related requests
 * 
 * Validation Rules:
 * - Product ID must be valid MongoDB ID
 * - Quantity must be positive number
 * - Variant must include size, color, and SKU
 */

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

type ValidationRule = 'addToCart' | 'updateCartItem' | 'removeFromCart';

const validations = {
  addToCart: [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('variant').isObject().withMessage('Variant details are required'),
    body('variant.size').isString().notEmpty().withMessage('Size is required'),
    body('variant.color').isString().notEmpty().withMessage('Color is required'),
    body('variant.sku').isString().notEmpty().withMessage('SKU is required')
  ],
  updateCartItem: [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('variantSku').isString().notEmpty().withMessage('Variant SKU is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or greater')
  ],
  removeFromCart: [
    body('productId').isMongoId().withMessage('Valid product ID is required'),
    body('variantSku').isString().notEmpty().withMessage('Variant SKU is required')
  ]
};

export const validate = (rule: ValidationRule) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations[rule].map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    next();
  };
}; 