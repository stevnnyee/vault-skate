/**
 * Product Model Definition
 * Defines the Mongoose schema and model for products in the skateboard shop
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { IProduct, ProductCategory, ProductBrand, IProductVariation } from '../types/models/product.types';

/**
 * Product Document Interface
 * Extends the base product interface with Mongoose document methods
 */
export interface IProductDocument extends Document, Omit<IProduct, '_id'> {
  _id: Types.ObjectId;
  calculateRating: () => void;
}

/**
 * Product Schema Definition
 * Defines the MongoDB schema for products with all fields and validations
 */
const ProductSchema = new Schema<IProductDocument>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    required: true,
    enum: Object.values(ProductCategory)
  },
  brand: {
    type: String,
    required: true,
    enum: Object.values(ProductBrand)
  },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, default: 0 },
  variations: [{
    size: String,
    color: String,
    sku: { type: String, required: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    additionalPrice: { type: Number, required: true, default: 0 }
  }],
  images: [{ 
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL'
    }
  }],
  isActive: { type: Boolean, default: true },
  tags: [{ type: String }],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    userId: { type: Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
  }]
}, {
  timestamps: true,
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  }
});

/**
 * Calculate Average Rating Method
 * Updates the product's average rating based on all reviews
 */
ProductSchema.methods.calculateRating = function() {
  if (!this.reviews || this.reviews.length === 0) {
    this.ratings = { average: 0, count: 0 };
    return;
  }

  const total = this.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
  this.ratings = {
    average: total / this.reviews.length,
    count: this.reviews.length
  };
};

/**
 * Pre-save Middleware
 * Validates variation prices and SKU uniqueness
 */
ProductSchema.pre('save', function(next) {
  // Check for negative total prices in variations
  if (this.variations) {
    const basePrice = this.basePrice;
    const skus = new Set<string>();

    for (const variation of this.variations) {
      // Check total price
      const totalPrice = basePrice + variation.additionalPrice;
      if (totalPrice < 0) {
        next(new Error('Total price (base price + additional price) cannot be negative'));
        return;
      }

      // Check SKU uniqueness
      if (skus.has(variation.sku)) {
        next(new Error('Duplicate SKU found in variations'));
        return;
      }
      skus.add(variation.sku);
    }
  }
  next();
});

// Create and export the Product model
const Product = mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;