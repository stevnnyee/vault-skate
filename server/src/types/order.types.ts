// src/types/order.types.ts
import { Types } from 'mongoose';
import { IAddress } from './common.types';  // Import IAddress from common types

/**
 * Order status enumeration
 * Tracks the current state of an order
 */
export enum OrderStatus {
  PENDING = 'Pending',         // Order created but not processed
  PROCESSING = 'Processing',   // Order is being prepared
  SHIPPED = 'Shipped',        // Order has been shipped
  DELIVERED = 'Delivered',    // Order has been delivered
  CANCELLED = 'Cancelled'     // Order was cancelled
}

/**
 * Payment method enumeration
 * Available payment options for orders
 */
export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card', // Credit card payment
  DEBIT_CARD = 'Debit Card',  // Debit card payment
  PAYPAL = 'PayPal',          // PayPal payment
  STRIPE = 'Stripe'           // Stripe payment
}

/**
 * Interface for items within an order
 * @interface IOrderItem
 */
export interface IOrderItem {
  product: Types.ObjectId;     // Reference to product
  quantity: number;            // Quantity ordered
  price: number;               // Price at time of order
  variation?: {                // Selected product variation
    size?: string;            // Size if applicable
    color?: string;           // Color if applicable
    sku: string;              // Stock keeping unit
  };
}

/**
 * Main order interface
 * Defines the structure for order documents
 * @interface IOrder
 */
export interface IOrder {
  _id: Types.ObjectId;         // MongoDB document ID
  user: Types.ObjectId;        // Reference to user
  orderNumber: string;         // Unique order identifier
  items: IOrderItem[];         // Order items
  totalAmount: number;         // Total order amount
  shippingAddress: IAddress;   // Delivery address (using imported IAddress)
  billingAddress: IAddress;    // Billing address (using imported IAddress)
  status: OrderStatus;         // Current order status
  paymentMethod: PaymentMethod; // Payment method used
  paymentStatus: 'Unpaid' | 'Paid' | 'Refunded'; // Payment state
  trackingNumber?: string;     // Shipping tracking number
  shippingMethod?: string;     // Selected shipping method
  notes?: string;              // Order notes
  orderDate: Date;             // Date order was placed
  shippedDate?: Date;          // Date order was shipped
  deliveredDate?: Date;        // Date order was delivered
  createdAt: Date;             // Document creation date
  updatedAt: Date;             // Last update date
}