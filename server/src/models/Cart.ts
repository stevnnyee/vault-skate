/**
 * Cart Model
 * Handles shopping cart data structure and methods
 * 
 * Features:
 * - Cart item management
 * - Subtotal calculation
 * - Auto-updating timestamps
 * - User association
 * - Cart expiration
 * - Price tracking
 */

import mongoose, { Schema, Model } from 'mongoose';
import { ICartDocument, ICart } from '../types/models/cart.types';
import Product from './product';

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  variant: {
    size: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true
    }
  }
});

const CartSchema = new Schema<ICartDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Calculate subtotal before saving
CartSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    this.subtotal = await this.calculateSubtotal();
    this.lastUpdated = new Date();
    
    // Reset expiration date when cart is modified
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Method to calculate cart subtotal
CartSchema.methods.calculateSubtotal = async function(): Promise<number> {
  let total = 0;
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      // Find the variant price if it exists, otherwise use base price
      const variant = product.variations?.find(v => v.sku === item.variant.sku);
      const price = variant ? product.basePrice + variant.additionalPrice : product.basePrice;
      
      // Update item price if it has changed
      if (item.price !== price) {
        item.price = price;
      }
      
      total += price * item.quantity;
    }
  }
  
  return Number(total.toFixed(2));
};

const Cart = mongoose.model<ICartDocument>('Cart', CartSchema);

export default Cart;