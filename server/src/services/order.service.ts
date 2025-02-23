/**
 * Order Service
 * Implements core business logic for order management.
 * 
 * Core Functionalities:
 * 1. Order Management:
 *    - Order creation and validation
 *    - Status updates and tracking
 *    - Payment processing
 *    - Order retrieval and filtering
 * 
 * 2. Business Rules:
 *    - Stock validation and updates
 *    - Price calculations
 *    - Status transition rules
 *    - Access control logic
 * 
 * 3. Data Processing:
 *    - Order data validation
 *    - Price calculations
 *    - Status management
 *    - Analytics generation
 * 
 * 4. Analytics & Reporting:
 *    - Order statistics
 *    - Revenue tracking
 *    - User purchase analysis
 *    - Trend calculations
 * 
 * Database Operations:
 * - CRUD operations for orders
 * - Transaction management
 * - Atomic updates
 * - Data consistency
 * 
 * Security:
 * - Data validation
 * - Access control
 * - Transaction integrity
 * - Error handling
 */

import { Types } from 'mongoose';
import Order from '../models/order';
import Product from '../models/product';
import { ProductService } from './product.service';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingMethod,
  OrderDocument,
  IOrderDocument,
  IOrderItem
} from '../types/models/order.types';
import { 
  CreateOrderInput, 
  OrderItemInput,
  UpdateOrderStatusInput,
  UpdatePaymentStatusInput,
  OrderPaginationResult
} from '../types/services/order.service.types';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { generateOrderNumber } from '../utils/order.utils';

export class OrderService {
  /**
   * Creates a new order
   * Validates items and processes the order creation
   */
  static async createOrder(userId: string, orderData: CreateOrderInput): Promise<IOrderDocument & { _id: Types.ObjectId }> {
    // Check stock levels for all items
    for (const item of orderData.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error('Insufficient stock');
      }
    }

    const orderNumber = await generateOrderNumber();
    
    const order = await Order.create({
      user: userId,
      orderNumber,
      items: orderData.items.map(item => ({
        product: item.product,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant
      })),
      totalAmount: orderData.items.reduce((total, item) => total + (item.price * item.quantity), 0),
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
      shippingMethod: orderData.shippingMethod,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      orderDate: new Date()
    });

    // Update stock levels
    for (const item of orderData.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    return order as IOrderDocument & { _id: Types.ObjectId };
  }

  /**
   * Updates order status
   * Handles status transitions and related updates
   */
  static async updateOrderStatus(
    orderId: string, 
    status: OrderStatus
  ): Promise<IOrderDocument & { _id: Types.ObjectId }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.status = status;

    if (status === OrderStatus.SHIPPED) {
      order.shippedDate = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      order.deliveredDate = new Date();
    }

    return await order.save() as IOrderDocument & { _id: Types.ObjectId };
  }

  /**
   * Updates payment status
   * Handles payment status changes and related updates
   */
  static async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus
  ): Promise<IOrderDocument & { _id: Types.ObjectId }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.paymentStatus = status;
    return await order.save() as IOrderDocument & { _id: Types.ObjectId };
  }

  /**
   * Retrieves order by ID
   * Returns complete order details
   */
  static async getOrderById(orderId: string): Promise<IOrderDocument & { _id: Types.ObjectId }> {
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name description images');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  /**
   * Gets orders for a specific user
   * Returns paginated list of user's orders
   */
  static async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: IOrderDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name price'),
      Order.countDocuments({ user: userId })
    ]);

    return {
      orders: orders.map(order => order.toObject() as IOrderDocument),
      total
    };
  }

  /**
   * Gets all orders with filters
   * Admin function for order management
   */
  static async getAllOrders(
    filters: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: IOrderDocument[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        query.orderDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.orderDate.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'email firstName lastName')
        .populate('items.product', 'name price'),
      Order.countDocuments(query)
    ]);

    return {
      orders: orders.map(order => order.toObject() as IOrderDocument),
      total
    };
  }

  /**
   * Gets orders with pagination and filters
   * Supports both user-specific and admin queries
   */
  static async getOrders(
    userId: string | null,
    page: number,
    limit: number,
    filters: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    orders: Array<IOrderDocument & { _id: Types.ObjectId }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = {};

    // Apply user filter if not admin
    if (userId) {
      query.user = userId;
    }

    // Apply status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // Apply payment status filter
    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        query.orderDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.orderDate.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'email firstName lastName')
        .populate('items.product', 'name price'),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders: orders.map(order => order.toObject()) as Array<IOrderDocument & { _id: Types.ObjectId }>,
      total,
      page,
      totalPages
    };
  }

  /**
   * Gets order history with filters
   * Supports both user-specific and admin queries
   */
  static async getOrderHistory(
    userId: string,
    page: number,
    limit: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      paymentStatus?: string;
    }
  ): Promise<{
    orders: IOrderDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { user: userId };

    // Apply status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // Apply payment status filter
    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        query.orderDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.orderDate.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name price'),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Gets order analytics
   * Calculates various metrics and trends
   */
  static async getOrderAnalytics(
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
  }> {
    return Order.getOrderAnalytics(timeframe, startDate, endDate);
  }

  /**
   * Gets user purchase trends
   * Analyzes user's ordering patterns
   */
  static async getUserPurchaseTrends(
    userId: string,
    dateRange: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
    frequentlyPurchasedProducts: Array<{
      productId: string;
      name: string;
      count: number;
    }>;
    purchaseHistory: Array<{
      date: string;
      amount: number;
    }>;
  }> {
    const query: any = { user: userId };
    if (dateRange.startDate || dateRange.endDate) {
      query.orderDate = {};
      if (dateRange.startDate) query.orderDate.$gte = dateRange.startDate;
      if (dateRange.endDate) query.orderDate.$lte = dateRange.endDate;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name');

    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

    // Calculate frequently purchased products
    const productCounts = new Map<string, { name: string; count: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.toString();
        const existing = productCounts.get(productId) || { name: item.name, count: 0 };
        existing.count += item.quantity;
        productCounts.set(productId, existing);
      });
    });

    const frequentlyPurchasedProducts = Array.from(productCounts.entries())
      .map(([productId, { name, count }]) => ({ productId, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate purchase history
    const purchaseHistory = orders
      .map(order => ({
        date: order.orderDate.toISOString().split('T')[0],
        amount: order.totalAmount
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalSpent,
      orderCount,
      averageOrderValue,
      frequentlyPurchasedProducts,
      purchaseHistory
    };
  }

  /**
   * Generates revenue data grouped by timeframe
   * Helper function for analytics
   */
  static async generateRevenueByTimeframe(
    orders: IOrderDocument[],
    timeframe: 'day' | 'week' | 'month' | 'year'
  ): Promise<Array<{ date: string; orders: number; revenue: number }>> {
    const revenueMap = new Map<string, { orders: number; revenue: number }>();

    orders.forEach(order => {
      let dateKey: string;
      const orderDate = order.orderDate;

      switch (timeframe) {
        case 'day':
          dateKey = orderDate.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(orderDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          dateKey = orderDate.getFullYear().toString();
          break;
        default:
          dateKey = orderDate.toISOString().split('T')[0];
      }

      const existing = revenueMap.get(dateKey) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalAmount;
      revenueMap.set(dateKey, existing);
    });

    return Array.from(revenueMap.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const orderService = new OrderService();
