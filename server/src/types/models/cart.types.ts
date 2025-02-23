// src/types/cart.types.ts
import { Types, Document } from 'mongoose';

/**
 * Interface for cart items
 * Represents individual items in the cart
 */
export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  variant: {
    size: string;
    color: string;
    sku: string;
  };
}

/**
 * Interface for cart document
 * Represents the entire cart structure
 */
export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  subtotal: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

/**
 * Interface for cart document with Mongoose Document
 */
export interface ICartDocument extends Document, Omit<ICart, '_id'> {
  _id: Types.ObjectId;
  calculateSubtotal(): Promise<number>;
}