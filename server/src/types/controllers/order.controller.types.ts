/**
 * Order Controller Types
 * Defines types for order controller request/response handling
 */

import { Request } from 'express';
import { AuthenticatedRequest } from './auth.controller.types';
import { CreateOrderInput, OrderFilters } from '../services/order.service.types';

export interface CreateOrderRequest extends AuthenticatedRequest {
  body: CreateOrderInput;
}

export interface UpdateOrderStatusRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: {
    status: string;
  };
}

export interface UpdatePaymentStatusRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: {
    status: string;
  };
}

export interface GetOrderRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

export interface GetOrdersRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface GetOrderHistoryRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    userId?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface GetOrderAnalyticsRequest extends AuthenticatedRequest {
  query: {
    timeframe?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  };
} 