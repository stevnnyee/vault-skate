/**
 * Cart Controller Types
 * Defines types for cart controller request/response handling
 */

import { AuthenticatedRequest } from './auth.controller.types';

export interface AddToCartRequest extends AuthenticatedRequest {
  body: {
    productId: string;
    quantity: number;
    variant: {
      size: string;
      color: string;
      sku: string;
    };
  };
}

export interface UpdateCartItemRequest extends AuthenticatedRequest {
  body: {
    productId: string;
    variantSku: string;
    quantity: number;
  };
}

export interface RemoveFromCartRequest extends AuthenticatedRequest {
  body: {
    productId: string;
    variantSku: string;
  };
}

export interface GetCartRequest extends AuthenticatedRequest {
  // No additional properties needed, uses user from auth
} 