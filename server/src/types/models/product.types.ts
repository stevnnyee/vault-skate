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
 * Product variation interface
 * Defines structure for product variations (size, color, etc.)
 */
export interface IProductVariation {
  _id?: Types.ObjectId;
  size?: string;
  color?: string;
  sku: string;
  stockQuantity: number;
  additionalPrice: number;
}

/**
 * Product review interface
 * Defines structure for product reviews
 */
export interface IProductReview {
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Product ratings interface
 * Defines structure for product rating summary
 */
export interface IProductRatings {
  average: number;
  count: number;
}

/**
 * Main product interface
 * Defines the structure for all product documents
 */
export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  description: string;
  basePrice: number;
  category: ProductCategory;
  brand: ProductBrand;
  sku: string;
  stock: number;
  variations: IProductVariation[];
  images: string[];
  isActive: boolean;
  tags?: string[];
  ratings: IProductRatings;
  reviews: IProductReview[];
  createdAt: Date;
  updatedAt: Date;
}