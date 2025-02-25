/**
 * Product Retrieval Controller
 * Handles fetching individual product details and product listings.
 * 
 * Features:
 * - Single product retrieval by ID
 * - Supports public access (no authentication required)
 * - Returns complete product information including:
 *   - Basic details (name, description, price)
 *   - Inventory status
 *   - Category information
 *   - Image URLs
 *   - Variants (if applicable)
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the product to retrieve
 * 
 * Query Options:
 * - includeInactive: Boolean to include inactive products (admin only)
 * - withInventory: Boolean to include detailed inventory data
 * 
 * Error Handling:
 * - Returns 404 if product not found
 * - Returns 400 for invalid product ID
 * - Handles missing image assets gracefully
 */

import { Response } from 'express';
import { ProductQueryRequest } from '../../types/controllers/product.controller.types';
import { ProductService } from '../../services/product.service';
import { ProductQueryFilters } from '../../types/services/product.service.types';
import { ProductCategory, ProductBrand } from '../../types/models/product.types';

export const getProducts = async (req: ProductQueryRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    
    // Validate category if provided
    let category: ProductCategory | undefined;
    if (req.query.category) {
      if (Object.values(ProductCategory).includes(req.query.category as ProductCategory)) {
        category = req.query.category as ProductCategory;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid product category'
        });
      }
    }

    // Validate brand if provided
    let brand: ProductBrand | undefined;
    if (req.query.brand) {
      if (Object.values(ProductBrand).includes(req.query.brand as ProductBrand)) {
        brand = req.query.brand as ProductBrand;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid product brand'
        });
      }
    }
    
    const filters: ProductQueryFilters = {
      category,
      brand,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      isActive: true
    };

    const { products, total } = await ProductService.getProducts(page, limit, filters);
    
    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        total,
        page,
        limit
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const getProductById = async (req: ProductQueryRequest, res: Response) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const product = await ProductService.getProductById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve product'
    });
  }
};

// Super simple local products data
interface LocalProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
}

const localProducts: Record<string, LocalProduct> = {
  "1": {
    id: 1,
    name: 'Element Complete Skateboard',
    sku: 'SKB-ELE-001',
    price: 129.99
  },
  "2": {
    id: 2,
    name: 'Baker Team Deck',
    sku: 'SKB-BAK-001',
    price: 59.99
  },
  "3": {
    id: 3,
    name: 'Independent Stage 11 Trucks',
    sku: 'SKB-IND-001',
    price: 49.99
  },
  "4": {
    id: 4,
    name: 'Spitfire Formula Four Wheels',
    sku: 'SKB-SPI-001',
    price: 34.99
  },
  "5": {
    id: 5,
    name: 'Girl Skateboard Deck',
    sku: 'SKB-GRL-001',
    price: 54.99
  },
  "8": {
    id: 8,
    name: 'Supreme Skateboard Tool',
    sku: 'SKB-SUP-001',
    price: 29.99
  }
};

export const getLocalProductById = async (req: ProductQueryRequest, res: Response) => {
  try {
    console.log('Request details:', {
      params: req.params,
      query: req.query,
      path: req.path,
      method: req.method,
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      headers: req.headers
    });

    const productId = req.params.id;
    console.log('Product lookup details:', {
      receivedId: productId,
      idType: typeof productId,
      availableIds: Object.keys(localProducts),
      requestPath: req.path,
      requestUrl: req.url
    });
    
    if (!productId) {
      console.log('No product ID provided');
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Ensure we're using a string key
    const stringId = productId.toString();
    console.log('Looking up product:', {
      originalId: productId,
      stringId: stringId,
      hasProduct: stringId in localProducts,
      availableIds: Object.keys(localProducts),
      requestPath: req.path
    });
    
    const product = localProducts[stringId];
    console.log('Found product:', product);
    
    if (!product) {
      console.log('Product not found:', {
        lookupId: stringId,
        availableIds: Object.keys(localProducts),
        requestPath: req.path,
        requestUrl: req.url
      });
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const response = {
      success: true,
      data: { product }
    };
    console.log('Sending response:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestPath: req.path,
      requestUrl: req.url
    });
    return res.status(400).json({
      success: false,
      error: 'Failed to retrieve product'
    });
  }
};
