/**
 * Cart Service
 * Handles business logic for shopping cart operations
 */

import Cart from '../models/cart';
import Product from '../models/product';
import { ICartDocument } from '../types/models/cart.types';
import { Types } from 'mongoose';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class CartService {
  /**
   * Get or create a cart for a user
   */
  static async getCart(userId: string): Promise<ICartDocument> {
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
        subtotal: 0
      });
    }
    
    return cart;
  }

  /**
   * Validate product stock availability and get current price
   */
  private static async validateStockAndGetPrice(
    productId: string,
    variantSku: string,
    requestedQuantity: number
  ): Promise<number> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const variant = product.variations?.find(v => v.sku === variantSku);
    if (!variant) {
      throw new BadRequestError('Invalid product variant');
    }

    if (variant.stockQuantity < requestedQuantity) {
      throw new BadRequestError(
        `Insufficient stock. Only ${variant.stockQuantity} units available.`
      );
    }

    return product.basePrice + (variant.additionalPrice || 0);
  }

  /**
   * Add an item to the cart
   */
  static async addItem(
    userId: string,
    productId: string,
    quantity: number,
    variant: { size: string; color: string; sku: string }
  ): Promise<ICartDocument> {
    // Validate product exists and has sufficient stock
    const price = await this.validateStockAndGetPrice(productId, variant.sku, quantity);

    // Get or create cart
    let cart = await this.getCart(userId);

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      item => 
        item.product.toString() === productId &&
        item.variant.sku === variant.sku
    );

    if (existingItemIndex > -1) {
      // Validate total quantity when updating existing item
      const newTotalQuantity = cart.items[existingItemIndex].quantity + quantity;
      await this.validateStockAndGetPrice(productId, variant.sku, newTotalQuantity);
      
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity = newTotalQuantity;
      cart.items[existingItemIndex].price = price;
    } else {
      // Add new item
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price,
        variant
      });
    }

    await cart.save();
    return cart;
  }

  /**
   * Update item quantity in cart
   */
  static async updateItemQuantity(
    userId: string,
    productId: string,
    variantSku: string,
    quantity: number
  ): Promise<ICartDocument> {
    // Validate stock if increasing quantity
    let price: number | undefined;
    if (quantity > 0) {
      price = await this.validateStockAndGetPrice(productId, variantSku, quantity);
    }

    const cart = await this.getCart(userId);
    
    const itemIndex = cart.items.findIndex(
      item => 
        item.product.toString() === productId &&
        item.variant.sku === variantSku
    );

    if (itemIndex === -1) {
      throw new NotFoundError('Item not found in cart');
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity and price
      cart.items[itemIndex].quantity = quantity;
      if (price !== undefined) {
        cart.items[itemIndex].price = price;
      }
    }

    await cart.save();
    return cart;
  }

  /**
   * Remove an item from the cart
   */
  static async removeItem(
    userId: string,
    productId: string,
    variantSku: string
  ): Promise<ICartDocument> {
    const cart = await this.getCart(userId);
    
    cart.items = cart.items.filter(
      item => 
        !(item.product.toString() === productId &&
          item.variant.sku === variantSku)
    );

    await cart.save();
    return cart;
  }

  /**
   * Clear all items from the cart
   */
  static async clearCart(userId: string): Promise<ICartDocument> {
    const cart = await this.getCart(userId);
    
    cart.items = [];
    await cart.save();
    
    return cart;
  }

  /**
   * Refresh cart prices
   * Updates item prices based on current product prices
   */
  static async refreshPrices(userId: string): Promise<{
    cart: ICartDocument;
    priceChanges: Array<{
      productId: string;
      variantSku: string;
      oldPrice: number;
      newPrice: number;
    }>;
  }> {
    const cart = await this.getCart(userId);
    const priceChanges = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const variant = product.variations?.find(v => v.sku === item.variant.sku);
        const currentPrice = variant 
          ? product.basePrice + variant.additionalPrice 
          : product.basePrice;

        if (currentPrice !== item.price) {
          priceChanges.push({
            productId: product._id.toString(),
            variantSku: item.variant.sku,
            oldPrice: item.price,
            newPrice: currentPrice
          });
          item.price = currentPrice;
        }
      }
    }

    if (priceChanges.length > 0) {
      await cart.save();
    }

    return { cart, priceChanges };
  }
}
