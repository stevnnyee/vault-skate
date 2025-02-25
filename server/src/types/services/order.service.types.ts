/**
 * Order Service Types
 * Defines types for order service operations
 */

import { IAddress } from '../models/common.types';
import { IOrderItem, OrderStatus, PaymentStatus, ShippingMethod, PaymentMethod } from '../models/order.types';

export interface OrderItemInput {
  product: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  variant: {
    size: string;
    color: string;
    sku: string;
  };
}

export interface AddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface UpdatePaymentStatusInput {
  paymentStatus: PaymentStatus;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderPaginationResult<T> {
  orders: T[];
  total: number;
  page: number;
  limit: number;
} 