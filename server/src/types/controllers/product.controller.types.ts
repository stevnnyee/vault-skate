import { Request } from 'express';
import { 
  CreateProductInput, 
  UpdateProductInput, 
  ProductQueryFilters 
} from '../services/product.service.types';
import { AuthenticatedRequest } from './auth.controller.types';
import { ParamsDictionary } from 'express-serve-static-core';

export interface CreateProductRequest extends AuthenticatedRequest {
  body: CreateProductInput;
}

export interface UpdateProductRequest extends AuthenticatedRequest {
  body: UpdateProductInput;
  params: {
    id: string;
  };
}

export interface GetProductRequest extends Request {
  params: {
    id: string;
  };
}

export interface GetProductsRequest extends Request {
  query: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    brand?: string;
    sortBy?: string;
    sortDirection?: string;
    tags?: string;
    inStock?: string;
    featured?: string;
  };
}

export interface DeleteProductRequest extends AuthenticatedRequest {
  params: {
    id: string;
  }
}

export interface ProductQueryRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
  };
  params: ParamsDictionary & {
    id?: string;
  };
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}