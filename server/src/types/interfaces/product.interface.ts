import { Types } from 'mongoose';

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  HOME = 'home',
  BEAUTY = 'beauty',
  SPORTS = 'sports',
  TOYS = 'toys',
  OTHER = 'other'
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface IProductVariant {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: {
    [key: string]: string | number | boolean;
  };
}

export interface IProductReview {
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  images: string[];
  variants?: IProductVariant[];
  attributes?: {
    [key: string]: string | number | boolean;
  };
  tags?: string[];
  isActive: boolean;
  isFeatured?: boolean;
  reviews?: IProductReview[];
  ratings?: {
    average: number;
    count: number;
  };
  dimensions?: {
    weight?: number;
    width?: number;
    height?: number;
    depth?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}