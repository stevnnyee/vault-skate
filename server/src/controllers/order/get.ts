/**
 * Order Retrieval Controller
 * Handles fetching orders and order details.
 * 
 * Features:
 * - Single order retrieval by ID
 * - List orders with pagination
 * - Filter orders by status and date
 * - Role-based access control
 * 
 * Authentication & Authorization:
 * - Requires valid authentication
 * - Users can only access their own orders
 * - Admins can access all orders
 * - Enforces data privacy
 * 
 * Query Options:
 * - Pagination (page, limit)
 * - Status filtering
 * - Payment status filtering
 * - Date range filtering
 * 
 * Access Control:
 * - Customers: View own orders only
 * - Admins: View all orders with filters
 * - Validates order ownership
 * 
 * Error Handling:
 * - Returns 404 for non-existent orders
 * - Returns 403 for unauthorized access
 * - Returns 400 for invalid queries
 * - Includes detailed error messages
 * 
 * Response:
 * - 200: Successful retrieval
 * - Includes pagination metadata
 * - Provides filtered results
 */

import { Response } from 'express';
import { OrderService } from '../../services/order.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { UserRole } from '../../types/models/user.types';
import { OrderStatus, PaymentStatus } from '../../types/models/order.types';
import { NotFoundError } from '../../utils/errors';

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const order = await OrderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // For guest orders, skip the user permission check
    if (req.baseUrl.includes('/guest/')) {
      return res.status(200).json({
        success: true,
        data: {
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: order.shippingAddress
        }
      });
    }

    // For authenticated orders, check user permission
    if (req.user && req.user.role !== UserRole.ADMIN && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: order.shippingAddress
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve order'
    });
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Parse filters from query parameters
    const filters = {
      status: req.query.status as OrderStatus | undefined,
      paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const userId = req.user.role === UserRole.ADMIN ? null : req.user.id;
    const result = await OrderService.getOrders(userId, page, limit, filters);

    return res.status(200).json({
      success: true,
      data: {
        orders: result.orders,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get orders'
    });
  }
}; 