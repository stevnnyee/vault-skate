// src/models/order.ts

import mongoose, { Schema, Document, Types } from 'mongoose';
import { 
  IOrderDocument,
  IOrderModel,
  IOrderMethods,
  OrderStatus, 
  PaymentMethod,
  PaymentStatus,
  ShippingMethod
} from '../types/models/order.types';

/**
 * Order Model
 * Defines the Mongoose schema and model for orders.
 * 
 * Core Components:
 * 1. Schema Definitions:
 *    - Order details (items, totals)
 *    - Shipping information
 *    - Payment tracking
 *    - Status management
 * 
 * 2. Embedded Schemas:
 *    - Address schema (shipping/billing)
 *    - Order item schema (products, quantities)
 *    - Variant details
 * 
 * 3. Business Logic:
 *    - Order number generation
 *    - Total calculations
 *    - Status management
 *    - Date tracking
 * 
 * 4. Indexes:
 *    - Order number (unique)
 *    - User ID + creation date
 *    - Status and payment status
 *    - Product lookups
 * 
 * Features:
 * - Automatic order number generation
 * - Status transition tracking
 * - Payment status management
 * - Address validation
 * - Price calculations
 * 
 * Virtual Properties:
 * - Formatted total amount
 * - Shipping status checks
 * - Delivery estimates
 * 
 * Methods:
 * - Status updates
 * - Payment processing
 * - Refund handling
 * - Analytics calculations
 */

/**
 * Address Schema
 * Defines structure for shipping and billing addresses
 * Used as a sub-document in the order schema
 */
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

/**
 * Order Item Schema
 * Defines structure for individual items in an order
 * Includes product details and variant information
 */
const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  variant: {
    size: String,
    color: String,
    sku: String
  }
}, { _id: false });

/**
 * Order Schema
 * Main schema defining the structure of order documents
 * Includes all order-related fields and behavior
 */
const OrderSchema = new Schema<IOrderDocument, IOrderModel, IOrderMethods>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}` // Generate unique order number
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  shippingAddress: {
    type: AddressSchema,
    required: true
  },
  billingAddress: {
    type: AddressSchema,
    required: true
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
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.UNPAID
  },
  trackingNumber: String,
  shippingMethod: {
    type: String,
    enum: Object.values(ShippingMethod),
    required: true,
    default: ShippingMethod.STANDARD
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative']
  },
  estimatedDeliveryDate: Date,
  notes: String,
  orderDate: {
    type: Date,
    default: Date.now
  },
  shippedDate: Date,
  deliveredDate: Date
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Database Indexes
 * Optimizes query performance for common operations
 */
// OrderSchema.index({ orderNumber: 1 }, { unique: true }); // Remove duplicate index
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ 'items.product': 1 });

/**
 * Virtual Properties
 * Computed properties for order documents
 */
OrderSchema.virtual('formattedTotal').get(function(this: IOrderDocument) {
  return `$${this.totalAmount.toFixed(2)}`;
});

OrderSchema.virtual('isFullyShipped').get(function(this: IOrderDocument) {
  return this.status === OrderStatus.SHIPPED || this.status === OrderStatus.DELIVERED;
});

/**
 * Instance Methods
 * Methods available on individual order documents
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
 * Static Methods
 * Methods available on the Order model itself
 */
OrderSchema.statics.findByUser = function(userId: string) {
  return this.find({ user: userId })
    .sort({ orderDate: -1 })
    .populate('items.product');
};

OrderSchema.statics.findByStatus = function(status: OrderStatus) {
  return this.find({ status })
    .sort({ orderDate: -1 })
    .populate('user', 'email name');
};

OrderSchema.statics.findRecentOrders = function(limit = 10) {
  return this.find()
    .sort({ orderDate: -1 })
    .limit(limit)
    .populate('user', 'email name')
    .populate('items.product', 'name price');
};

OrderSchema.statics.getOrderAnalytics = async function(
  timeframe: 'day' | 'week' | 'month' | 'year',
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByTimeframe: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}> {
  const query: any = {};
  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = startDate;
    if (endDate) query.orderDate.$lte = endDate;
  }

  const orders = await this.find(query);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate orders by status
  const ordersByStatus = orders.reduce((acc: Record<string, number>, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Generate revenue by timeframe
  const revenueMap = new Map<string, { orders: number; revenue: number }>();
  orders.forEach(order => {
    let dateKey: string;
    const orderDate = order.orderDate;

    switch (timeframe) {
      case 'day':
        dateKey = orderDate.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(orderDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        dateKey = orderDate.getFullYear().toString();
        break;
      default:
        dateKey = orderDate.toISOString().split('T')[0];
    }

    const existing = revenueMap.get(dateKey) || { orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += order.totalAmount;
    revenueMap.set(dateKey, existing);
  });

  const revenueByTimeframe = Array.from(revenueMap.entries())
    .map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: data.revenue
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    ordersByStatus,
    revenueByTimeframe
  };
};

/**
 * Calculation Methods
 * Methods for computing order-related values
 */
OrderSchema.methods.calculateTax = function(this: IOrderDocument) {
  // Basic tax calculation (can be made more sophisticated)
  const TAX_RATE = 0.1; // 10%
  return this.totalAmount * TAX_RATE;
};

OrderSchema.methods.calculateShipping = function(this: IOrderDocument) {
  const baseRates = {
    [ShippingMethod.STANDARD]: 5.99,
    [ShippingMethod.EXPRESS]: 15.99,
    [ShippingMethod.OVERNIGHT]: 29.99,
    [ShippingMethod.LOCAL_PICKUP]: 0
  };
  return baseRates[this.shippingMethod];
};

OrderSchema.methods.processRefund = async function(this: IOrderDocument, amount: number) {
  if (amount > this.totalAmount) {
    throw new Error('Refund amount cannot exceed order total');
  }
  this.refundAmount = amount;
  this.paymentStatus = amount === this.totalAmount ? 
    PaymentStatus.REFUNDED : 
    PaymentStatus.PARTIALLY_REFUNDED;
  return await this.save();
};

OrderSchema.methods.updateEstimatedDelivery = async function(this: IOrderDocument) {
  const deliveryDays = {
    [ShippingMethod.STANDARD]: 5,
    [ShippingMethod.EXPRESS]: 2,
    [ShippingMethod.OVERNIGHT]: 1,
    [ShippingMethod.LOCAL_PICKUP]: 0
  };
  
  const days = deliveryDays[this.shippingMethod];
  this.estimatedDeliveryDate = new Date(
    Date.now() + (days * 24 * 60 * 60 * 1000)
  );
  return await this.save();
};

/**
 * Pre-save Middleware
 * Executes before saving order documents
 */
OrderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// Create and export the Order model
const Order = mongoose.model<IOrderDocument, IOrderModel>('Order', OrderSchema);

export default Order;