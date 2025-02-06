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
  sku: string; 
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
  variations: {
    type: [{
      size: String,
      color: String,
      sku: {
        type: String,
        required: [true, 'SKU is required for each variation']
      },
      additionalPrice: {
        type: Number,
        default: 0,
        validate: {
          validator: function(this: any, value: number) {
            const basePrice = (this as any).parent().parent().basePrice;
            return basePrice + (value || 0) >= 0;
          },
          message: 'Total price (base price + additional price) cannot be negative'
        }
      },
      stockQuantity: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    validate: {
      validator: function(variations: any[]) {
        const skus = variations.map(v => v.sku);
        const uniqueSkus = new Set(skus);
        return skus.length === uniqueSkus.size;
      },
      message: 'SKUs must be unique across all variations'
    }
  },
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

// Pre-save middleware to validate total prices
ProductSchema.pre('save', function(next) {
  const basePrice = this.basePrice;
  
  for (const variation of this.variations) {
    const totalPrice = basePrice + (variation.additionalPrice || 0);
    if (totalPrice < 0) {
      next(new Error('Total price (base price + additional price) cannot be negative'));
      return;
    }
  }
  
  next();
});

// Create and export the Product model
const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;