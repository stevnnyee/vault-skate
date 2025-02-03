import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface for cart item
interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  variation?: {
    size?: string;
    color?: string;
  };
  price: number;
}

// Interface for Cart model with explicit mongoose.Document
interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  lastUpdated: Date;
}

// Cart Schema
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

// Pre-save middleware to update total amount
CartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item: ICartItem) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.lastUpdated = new Date();
  next();
});

// Method to add item to cart
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

// Method to remove item from cart
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

// Static method to find cart by user
CartSchema.statics.findByUser = function(userId: string) {
  return this.findOne({ user: userId }).populate('items.product');
};

// Create and export the Cart model
const Cart = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;