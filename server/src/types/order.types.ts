// src/types/order.types.ts

import { Document, Model, Types } from 'mongoose';
import { IAddress } from './common.types';

/**
 * Enum representing possible order statuses
 * Used to track the lifecycle of an order from creation to completion
 */
export enum OrderStatus {
  PENDING = 'Pending',      // Initial state when order is created
  PROCESSING = 'Processing', // Order is being prepared/packed
  SHIPPED = 'Shipped',      // Order has been shipped to customer
  DELIVERED = 'Delivered',  // Order has been delivered successfully
  CANCELLED = 'Cancelled'   // Order has been cancelled
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
 * Interface defining structure of items within an order
 * Each item represents a product being purchased with its details
 */
export interface IOrderItem {
  product: Types.ObjectId;     // Reference to the product in database
  quantity: number;            // Number of items ordered
  price: number;              // Price per unit at time of order
  variation?: {               // Optional product variations
    size?: string;           // Size variation if applicable
    color?: string;          // Color variation if applicable
    sku: string;            // Stock keeping unit
  };
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
  paymentStatus: 'Unpaid' | 'Paid' | 'Refunded'; // Payment state
  trackingNumber?: string;     // Shipping tracking number
  shippingMethod?: string;     // Method of shipping
  notes?: string;              // Additional order notes
  orderDate: Date;             // When order was placed
  shippedDate?: Date;          // When order was shipped
  deliveredDate?: Date;        // When order was delivered
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
}

/**
 * Interface extending base order with Mongoose Document
 * Combines order properties with Mongoose Document functionality
 */
export interface IOrderDocument extends IOrderBase, Document {}

/**
 * Interface for static model methods
 * Defines methods available on the Order model itself
 */
export interface IOrderModel extends Model<IOrderDocument, {}, IOrderMethods> {
  findByUser(userId: string): Promise<IOrderDocument[]>;          // Find orders by user
  findByStatus(status: OrderStatus): Promise<IOrderDocument[]>;   // Find orders by status
  findRecentOrders(limit?: number): Promise<IOrderDocument[]>;    // Find recent orders
}