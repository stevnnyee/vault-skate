import mongoose from 'mongoose';

// Enum for product categories
export enum ProductCategory {
  COMPLETE_SKATEBOARD = 'Complete Skateboard',
  DECK = 'Deck',
  TRUCKS = 'Trucks',
  WHEELS = 'Wheels',
  BEARINGS = 'Bearings',
  GRIP_TAPE = 'Grip Tape',
  HARDWARE = 'Hardware',
  ACCESSORIES = 'Accessories'
}

// Enum for product brands
export enum ProductBrand {
  ELEMENT = 'Element',
  SANTA_CRUZ = 'Santa Cruz',
  ENJOI = 'Enjoi',
  GIRL = 'Girl',
  PLAN_B = 'Plan B',
  ALMOST = 'Almost',
  INDEPENDENT = 'Independent',
  THUNDER = 'Thunder'
}

// Interface for product variations (e.g., sizes, colors)
interface ProductVariation {
  size?: string;
  color?: string;
  additionalPrice?: number;
  stockQuantity: number;
}

// Product Schema Interface
interface IProduct extends mongoose.Document {
  name: string;
  description: string;
  category: ProductCategory;
  brand: ProductBrand;
  basePrice: number;
  salePrice?: number;
  variations: ProductVariation[];
  images: string[]; // URLs to product images
  specs: {
    length?: number;
    width?: number;
    material?: string;
    weight?: number;
  };
  features: string[];
  isActive: boolean;
  averageRating?: number;
  totalRatings?: number;
  dateAdded: Date;
  lastUpdated: Date;
}

// Mongoose Schema
const ProductSchema = new mongoose.Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(ProductCategory),
    required: true
  },
  brand: {
    type: String,
    enum: Object.values(ProductBrand),
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  variations: [{
    size: String,
    color: String,
    additionalPrice: {
      type: Number,
      default: 0
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL'
    }
  }],
  specs: {
    length: Number,
    width: Number,
    material: String,
    weight: Number
  },
  features: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    min: 0
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to update lastUpdated
ProductSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find products by category
ProductSchema.statics.findByCategory = function(category: ProductCategory) {
  return this.find({ category, isActive: true });
};

// Static method to find products by brand
ProductSchema.statics.findByBrand = function(brand: ProductBrand) {
  return this.find({ brand, isActive: true });
};

// Create and export the Product model
const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;