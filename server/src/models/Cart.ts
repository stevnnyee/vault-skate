/**
 * Cart Model
 * Manages shopping cart functionality for users.
 * 
 * Features:
 * - Stores cart items with quantities and variations
 * - Calculates total amounts automatically
 * - Handles product variations (size, color)
 * - Tracks cart updates
 * - Provides methods for cart manipulation
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Cart Item Interface
 * Defines the structure of individual items in the cart
 * 
 * Properties:
 * - product: Reference to the product
 * - quantity: Number of items
 * - variation: Optional size/color variations
 * - price: Item price at time of adding
 */
interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  variation?: {
    size?: string;
    color?: string;
  };
  price: number;
}

/**
 * Cart Interface
 * Defines the structure of the shopping cart document
 * 
 * Properties:
 * - user: Reference to the cart owner
 * - items: Array of cart items
 * - totalAmount: Calculated cart total
 * - lastUpdated: Timestamp of last modification
 */
interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  lastUpdated: Date;
}

/**
 * Cart Schema
 * Defines the MongoDB schema for shopping carts
 * 
 * Features:
 * - One cart per user (unique constraint)
 * - Stores multiple items with variations
 * - Tracks total amount and updates
 * - Maintains modification timestamps
 */
const CartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
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
    variation: {
      size: String,
      color: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Pre-save Middleware
 * Automatically updates cart totals and timestamps
 * Runs before each save operation
 */
CartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item: ICartItem) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.lastUpdated = new Date();
  next();
});

/**
 * Add Item Method
 * Adds or updates an item in the cart
 * 
 * @param productId - ID of the product to add
 * @param quantity - Number of items to add
 * @param price - Current price of the item
 * @param variation - Optional size/color variation
 * @returns Updated cart document
 */
CartSchema.methods.addItem = function(
  productId: Types.ObjectId, 
  quantity: number, 
  price: number, 
  variation?: { size?: string; color?: string }
) {
  const existingItemIndex = this.items.findIndex(
    (item: ICartItem) => 
      item.product.toString() === productId.toString() &&
      (!variation || 
        (item.variation?.size === variation.size && 
         item.variation?.color === variation.color))
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      price,
      variation
    });
  }

  return this.save();
};

/**
 * Remove Item Method
 * Removes an item from the cart
 * 
 * @param productId - ID of the product to remove
 * @param variation - Optional size/color variation
 * @returns Updated cart document
 */
CartSchema.methods.removeItem = function(
  productId: Types.ObjectId, 
  variation?: { size?: string; color?: string }
) {
  this.items = this.items.filter(
    (item: ICartItem) => 
      item.product.toString() !== productId.toString() ||
      (variation && 
        (item.variation?.size !== variation.size || 
         item.variation?.color !== variation.color))
  );

  return this.save();
};

/**
 * Find By User Static Method
 * Retrieves a user's cart with populated product details
 * 
 * @param userId - ID of the cart owner
 * @returns Cart document with populated product information
 */
CartSchema.statics.findByUser = function(userId: string) {
  return this.findOne({ user: userId }).populate('items.product');
};

// Create and export the Cart model
const Cart = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;