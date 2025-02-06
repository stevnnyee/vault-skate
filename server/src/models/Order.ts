// src/models/order.ts

import mongoose from 'mongoose';
import { 
  IOrderDocument,
  IOrderModel,
  IOrderMethods,
  OrderStatus, 
  PaymentMethod 
} from '../types/order.types';

/**
 * Mongoose schema for orders
 * Defines the structure, validation rules, and behavior of order documents
 */
const OrderSchema = new mongoose.Schema<IOrderDocument, IOrderModel, IOrderMethods>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}` // Generate unique order number
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    variation: {
      size: String,
      color: String,
      sku: {
        type: String,
        required: true
      }
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  billingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded'],
    default: 'Unpaid'
  },
  trackingNumber: String,
  shippingMethod: String,
  notes: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

/**
 * Database indexes for optimizing queries
 * Improves performance for commonly used queries
 */
OrderSchema.index({ orderNumber: 1 }, { unique: true }); // Ensure unique order numbers
OrderSchema.index({ user: 1 });                         // Optimize user lookups
OrderSchema.index({ status: 1 });                       // Optimize status queries
OrderSchema.index({ orderDate: -1 });                   // Optimize date sorting
OrderSchema.index({ 'items.product': 1 });              // Optimize product lookups

/**
 * Virtual property for formatted total amount
 * Returns the total amount with currency symbol
 */
OrderSchema.virtual('formattedTotal').get(function(this: IOrderDocument) {
  return `$${this.totalAmount.toFixed(2)}`;
});

/**
 * Virtual property to check shipping status
 * Returns true if order is either shipped or delivered
 */
OrderSchema.virtual('isFullyShipped').get(function(this: IOrderDocument) {
  return this.status === OrderStatus.SHIPPED || this.status === OrderStatus.DELIVERED;
});

/**
 * Instance method to update order status
 * Updates status and sets relevant dates automatically
 * @param newStatus - The new status to set
 * @returns Updated order document
 */
OrderSchema.methods.updateStatus = async function(this: IOrderDocument, newStatus: OrderStatus) {
  this.status = newStatus;
  if (newStatus === OrderStatus.SHIPPED) {
    this.shippedDate = new Date();
  } else if (newStatus === OrderStatus.DELIVERED) {
    this.deliveredDate = new Date();
  }
  return await this.save();
};

/**
 * Static method to find orders by user
 * @param userId - The user's ID
 * @returns Array of orders for the user
 */
OrderSchema.statics.findByUser = function(userId: string) {
  return this.find({ user: userId })
    .sort({ orderDate: -1 })
    .populate('items.product');
};

/**
 * Static method to find orders by status
 * @param status - The order status to search for
 * @returns Array of orders with the specified status
 */
OrderSchema.statics.findByStatus = function(status: OrderStatus) {
  return this.find({ status })
    .sort({ orderDate: -1 })
    .populate('user', 'email name');
};

/**
 * Static method to find recent orders
 * @param limit - Maximum number of orders to return
 * @returns Array of recent orders
 */
OrderSchema.statics.findRecentOrders = function(limit = 10) {
  return this.find()
    .sort({ orderDate: -1 })
    .limit(limit)
    .populate('user', 'email name')
    .populate('items.product', 'name price');
};

// Create and export the Order model
const Order = mongoose.model<IOrderDocument, IOrderModel>('Order', OrderSchema);

export default Order;