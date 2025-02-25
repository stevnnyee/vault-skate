/**
 * Product Validation Middleware
 * Defines validation schemas and middleware for product-related operations.
 * 
 * Features:
 * - Validates product creation and updates
 * - Ensures data integrity and consistency
 * - Handles image URLs and variants
 * - Validates product queries and reviews
 * 
 * Validation Rules:
 * - Product names: 3-100 characters
 * - Descriptions: 10-1000 characters
 * - Prices: Positive numbers
 * - SKUs: Alphanumeric with hyphens
 * - Stock: Non-negative numbers
 * - Images: Valid URLs
 * - Reviews: 1-5 star rating
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';

/**
 * Product Image Schema
 * Validates image URLs and metadata for product images
 */
const productImageSchema = Joi.object({
  url: Joi.string().uri().required(),
  alt: Joi.string().optional(),
  isPrimary: Joi.boolean().optional()
});

/**
 * Product Variant Schema
 * Validates product variations (size, color, etc.)
 */
const productVariantSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().required(),
  price: Joi.number().positive().required(),
  compareAtPrice: Joi.number().positive().optional(),
  inventory: Joi.number().min(0).required(),
  attributes: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).required()
});

/**
 * Product Dimensions Schema
 * Validates physical dimensions and weight
 */
const dimensionsSchema = Joi.object({
  weight: Joi.number().positive().optional(),
  width: Joi.number().positive().optional(),
  height: Joi.number().positive().optional(),
  depth: Joi.number().positive().optional()
});

/**
 * Validation Schemas
 * Define Joi validation schemas for different product operations
 */
const schemas = {
  // Create product validation schema
  createProduct: Joi.object({
    name: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10).max(1000),
    basePrice: Joi.number().required().min(0),
    category: Joi.string().required().valid(...Object.values(ProductCategory)),
    brand: Joi.string().required().valid(...Object.values(ProductBrand)),
    sku: Joi.string().required().pattern(/^[A-Za-z0-9-]+$/),
    stock: Joi.number().required().min(0),
    variations: Joi.array().items(Joi.object({
      size: Joi.string().required(),
      color: Joi.string().required(),
      sku: Joi.string().required(),
      stockQuantity: Joi.number().required().min(0),
      additionalPrice: Joi.number().required()
    })),
    images: Joi.array().items(Joi.string().uri()),
    isActive: Joi.boolean(),
    tags: Joi.array().items(Joi.string())
  }),

  // Update product validation schema
  updateProduct: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(1000),
    basePrice: Joi.number().min(0),
    category: Joi.string().valid(...Object.values(ProductCategory)),
    brand: Joi.string().valid(...Object.values(ProductBrand)),
    sku: Joi.string().pattern(/^[A-Za-z0-9-]+$/),
    stock: Joi.number().min(0),
    variations: Joi.array().items(Joi.object({
      size: Joi.string().required(),
      color: Joi.string().required(),
      sku: Joi.string().required(),
      stockQuantity: Joi.number().required().min(0),
      additionalPrice: Joi.number().required()
    })),
    images: Joi.array().items(Joi.string().uri()),
    isActive: Joi.boolean(),
    tags: Joi.array().items(Joi.string())
  }),

  // Product query validation schema
  queryProducts: Joi.object({
    page: Joi.number().min(1),
    limit: Joi.number().min(1).max(100),
    category: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    search: Joi.string()
  }),

  // Product review validation schema
  productReview: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().optional()
  })
};

/**
 * Validation Middleware Factory
 * Creates middleware functions that validate requests against specified schemas
 * 
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 * 
 * Error Handling:
 * - Returns 400 Bad Request for validation errors
 * - Includes detailed error messages for each invalid field
 * - Passes other errors to next error handler
 */
const validate = (schema: Joi.ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
      next(error);
    }
  };
};

// Export validation middleware for different operations
export const validateCreateProduct = validate(schemas.createProduct);
export const validateUpdateProduct = validate(schemas.updateProduct);
export const validateQueryProducts = validate(schemas.queryProducts);
export const validateProductReview = validate(schemas.productReview);