// src/types/product.types.ts
import { Types } from 'mongoose';

/**
 * Product categories for the skateboard shop
 * Used for organizing and filtering products
 */
export enum ProductCategory {
  COMPLETE_SKATEBOARD = 'Complete Skateboard', // Full assembled skateboards
  DECK = 'Deck',                // Skateboard decks only
  TRUCKS = 'Trucks',            // Skateboard trucks
  WHEELS = 'Wheels',            // Skateboard wheels
  BEARINGS = 'Bearings',        // Wheel bearings
  GRIP_TAPE = 'Grip Tape',      // Deck grip tape
  HARDWARE = 'Hardware',        // Nuts, bolts, etc.
  ACCESSORIES = 'Accessories'    // Additional skateboarding gear
}

/**
 * Available brands in the skateboard shop
 * Used for product filtering and organization
 */
export enum ProductBrand {
  ELEMENT = 'Element',          // Element Skateboards
  SANTA_CRUZ = 'Santa Cruz',    // Santa Cruz Skateboards
  ENJOI = 'Enjoi',             // Enjoi Skateboards
  GIRL = 'Girl',               // Girl Skateboards
  PLAN_B = 'Plan B',           // Plan B Skateboards
  ALMOST = 'Almost',           // Almost Skateboards
  INDEPENDENT = 'Independent',  // Independent Trucks
  THUNDER = 'Thunder'          // Thunder Trucks
}

/**
 * Interface for product variations (sizes, colors, etc.)
 * @interface IProductVariation
 */
export interface IProductVariation {
  size?: string;                // Product size (if applicable)
  color?: string;               // Product color (if applicable)
  sku: string;                  // Unique identifier for this variation
  stockQuantity: number;        // Available quantity
  price: number;                // Price for this specific variation
}

/**
 * Main product interface
 * Defines the structure for all product documents in the database
 * @interface IProduct
 */
export interface IProduct {
  _id: Types.ObjectId;          // MongoDB document ID
  name: string;                 // Product name
  slug: string;                 // URL-friendly version of name
  description: string;          // Detailed product description
  category: ProductCategory;    // Product category
  brand: ProductBrand;          // Product brand
  basePrice: number;            // Base product price
  salePrice?: number;          // Optional sale price
  variations: IProductVariation[]; // Product variations
  images: string[];            // Array of image URLs
  isActive: boolean;           // Whether product is available
  createdAt: Date;             // Document creation date
  updatedAt: Date;             // Last update date
}