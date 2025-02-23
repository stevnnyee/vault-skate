// src/types/order.types.ts

import { Document, Model, Types } from 'mongoose';
import { IAddress } from './common.types';

/**
 * Enum representing possible order statuses
 * Used to track the lifecycle of an order from creation to completion
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

/**
 * Enum representing available payment methods
 * Used to specify how the customer will pay for the order
 */
export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card', // Payment via credit card
  DEBIT_CARD = 'Debit Card',  // Payment via debit card
  PAYPAL = 'PayPal',          // Payment via PayPal
  STRIPE = 'Stripe'           // Payment via Stripe
}

/**
 * Enum for payment status to avoid magic strings
 */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED'
}

/**
 * Enum for shipping methods to standardize options
 */
export enum ShippingMethod {
  STANDARD = 'Standard',
  EXPRESS = 'Express',
  OVERNIGHT = 'Overnight',
  LOCAL_PICKUP = 'Local Pickup'
}

/**
 * Interface defining structure of items within an order
 * Each item represents a product being purchased with its details
 */
export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
  subtotal: number;
}

/**
 * Base interface containing all order properties
 * Defines the core structure of an order document
 */
export interface IOrderBase {
  user: Types.ObjectId;        // Reference to user who placed order
  orderNumber: string;         // Unique identifier for order
  items: IOrderItem[];         // Array of items in order
  totalAmount: number;         // Total cost of order
  shippingAddress: IAddress;   // Delivery address
  billingAddress: IAddress;    // Billing address
  status: OrderStatus;         // Current status of order
  paymentMethod: PaymentMethod; // Method of payment
  paymentStatus: PaymentStatus;  // Update to use enum instead of string union
  trackingNumber?: string;     // Shipping tracking number
  shippingMethod: ShippingMethod;  // Update to use enum instead of optional string
  notes?: string;              // Additional order notes
  orderDate: Date;             // When order was placed
  shippedDate?: Date;          // When order was shipped
  deliveredDate?: Date;        // When order was delivered
  refundAmount?: number;  // Add refund tracking
  estimatedDeliveryDate?: Date;  // Add estimated delivery date
  createdAt: Date;             // Document creation timestamp
  updatedAt: Date;             // Document update timestamp
}

/**
 * Interface for instance methods
 * Defines methods available on individual order documents
 */
export interface IOrderMethods {
  updateStatus(newStatus: OrderStatus): Promise<IOrderDocument>; // Update order status
  formattedTotal: string;     // Format total amount with currency
  isFullyShipped: boolean;    // Check if order is shipped/delivered
  processRefund(amount: number): Promise<IOrderDocument>;
  updateEstimatedDelivery(): Promise<IOrderDocument>;
  calculateTax(): number;     // Add calculation methods
  calculateShipping(): number;
}

/**
 * Interface extending base order with Mongoose Document
 * Combines order properties with Mongoose Document functionality
 */
export interface IOrderDocument extends IOrderBase, Document {
  _id: Types.ObjectId;
}

/**
 * Interface for static model methods
 * Defines methods available on the Order model itself
 */
export interface IOrderModel extends Model<IOrderDocument, {}, IOrderMethods> {
  findByUser(userId: string): Promise<IOrderDocument[]>;          // Find orders by user
  findByStatus(status: OrderStatus): Promise<IOrderDocument[]>;   // Find orders by status
  findRecentOrders(limit?: number): Promise<IOrderDocument[]>;    // Find recent orders
  getOrderAnalytics(
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
  }>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface OrderItem {
  product: string; // Product ID
  quantity: number;
  price: number;
}

export interface Order {
  user: string; // User ID
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDocument extends Order, Document {
  _id: string;
}