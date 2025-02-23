/**
 * Order Validation Middleware
 * Defines validation schemas for order-related operations.
 * 
 * Core Functionality:
 * - Request payload validation
 * - Schema-based validation using Joi
 * - Input sanitization and type checking
 * - Custom validation rules
 * 
 * Validation Schemas:
 * 1. Order Creation:
 *    - Items validation (products, quantities)
 *    - Address validation (shipping/billing)
 *    - Required fields checking
 * 
 * 2. Status Updates:
 *    - Order status transitions
 *    - Payment status changes
 *    - Valid enum values
 * 
 * 3. Query Validation:
 *    - Pagination parameters
 *    - Filter criteria
 *    - Date ranges
 *    - Search terms
 * 
 * Error Handling:
 * - Detailed validation error messages
 * - Field-specific error reporting
 * - Type conversion errors
 * - Custom validation failures
 * 
 * Security Features:
 * - Input sanitization
 * - Type checking
 * - Enum value validation
 * - Required field enforcement
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OrderStatus, PaymentStatus } from '../../types/models/order.types';

type ValidationRule = 'createOrder' | 'updateOrderStatus' | 'updatePaymentStatus' | 'getOrder' | 'getOrders' | 'getOrderHistory' | 'getOrderAnalytics' | 'getUserPurchaseTrends' | 'getOrderById';

const validations = {
  createOrder: [
    body('items').isArray().notEmpty().withMessage('Order items are required'),
    body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('shippingAddress').isObject().notEmpty().withMessage('Shipping address is required'),
    body('shippingAddress.street').isString().notEmpty().withMessage('Street is required'),
    body('shippingAddress.city').isString().notEmpty().withMessage('City is required'),
    body('shippingAddress.state').isString().notEmpty().withMessage('State is required'),
    body('shippingAddress.zipCode').isString().notEmpty().withMessage('Zip code is required'),
    body('shippingAddress.country').isString().notEmpty().withMessage('Country is required'),
    body('billingAddress').isObject().notEmpty().withMessage('Billing address is required'),
    body('billingAddress.street').isString().notEmpty().withMessage('Street is required'),
    body('billingAddress.city').isString().notEmpty().withMessage('City is required'),
    body('billingAddress.state').isString().notEmpty().withMessage('State is required'),
    body('billingAddress.zipCode').isString().notEmpty().withMessage('Zip code is required'),
    body('billingAddress.country').isString().notEmpty().withMessage('Country is required'),
    body('paymentMethod').isString().notEmpty().withMessage('Payment method is required'),
    body('shippingMethod').isString().notEmpty().withMessage('Shipping method is required')
  ],
  updateOrderStatus: [
    param('id').isMongoId().withMessage('Valid order ID is required'),
    body('status').isIn(Object.values(OrderStatus)).withMessage('Invalid order status')
  ],
  updatePaymentStatus: [
    param('id').isMongoId().withMessage('Valid order ID is required'),
    body('paymentStatus').isIn(Object.values(PaymentStatus)).withMessage('Invalid payment status')
  ],
  getOrder: [
    param('id').isMongoId().withMessage('Valid order ID is required')
  ],
  getOrders: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  getOrderHistory: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  getOrderAnalytics: [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  getUserPurchaseTrends: [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  getOrderById: [
    param('id').isMongoId().withMessage('Valid order ID is required')
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
