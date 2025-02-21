// src/types/cart.types.ts
import { Types } from 'mongoose';

/**
 * Interface for items in the shopping cart
 * @interface ICartItem
 */
export interface ICartItem {
  product: Types.ObjectId;      // Reference to product
  variation: string;            // Selected variation ID
  quantity: number;             // Quantity in cart
  price: number;                // Current price
}

/**
 * Shopping cart interface
 * Defines the structure for shopping cart documents
 * @interface ICart
 */
export interface ICart {
  _id: Types.ObjectId;          // MongoDB document ID
  user: Types.ObjectId;         // Reference to user
  items: ICartItem[];           // Cart items
  totalAmount: number;          // Total cart amount
  lastUpdated: Date;            // Last cart update
  createdAt: Date;              // Document creation date
  updatedAt: Date;              // Last update date
}