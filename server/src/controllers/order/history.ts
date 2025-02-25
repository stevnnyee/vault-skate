/**
 * Order History Controller
 * Handles order history tracking and analytics.
 * 
 * Features:
 * - Order history retrieval with filtering
 * - Order analytics and reporting
 * - User purchase trends analysis
 * - Revenue tracking and statistics
 * 
 * Authentication & Authorization:
 * - Requires valid authentication
 * - Users can view their own history
 * - Admins can view all histories
 * - Analytics restricted to admins
 * 
 * History Features:
 * - Comprehensive order tracking
 * - Status change history
 * - Payment history
 * - Filtering by date range
 * - Pagination support
 * 
 * Analytics Features:
 * - Revenue analysis
 * - Order volume trends
 * - Status distribution
 * - Time-based comparisons
 * 
 * Purchase Trends:
 * - Individual user analytics
 * - Spending patterns
 * - Frequently purchased items
 * - Historical comparisons
 * 
 * Error Handling:
 * - Returns 403 for unauthorized access
 * - Returns 400 for invalid parameters
 * - Handles date parsing errors
 * - Includes detailed error messages
 * 
 * Response:
 * - 200: Successful retrieval
 * - Includes metadata and statistics
 * - Provides filtered results
 */

import { Response } from 'express';
import { 
  GetOrderHistoryRequest,
  GetOrderAnalyticsRequest 
} from '../../types/controllers/order.controller.types';
import { OrderService } from '../../services/order.service';
import { UserRole } from '../../types/models/user.types';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get order history for a user or all users (admin)
 * Includes status changes and payment history
 */
export const getOrderHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Parse and validate dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start date format'
        });
      }
    }

    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end date format'
        });
      }
    }

    const filters = {
      startDate,
      endDate,
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string
    };

    const result = await OrderService.getOrderHistory(req.user.id, page, limit, filters);

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
      error: error instanceof Error ? error.message : 'Failed to get order history'
    });
  }
};

/**
 * Get order analytics and statistics (admin only)
 * Includes revenue, order counts, trends
 */
export const getOrderAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month' | 'year') || 'month';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const analytics = await OrderService.getOrderAnalytics(timeframe, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order analytics'
    });
  }
};

/**
 * Get user purchase trends
 * Available to users for their own data and admins for all users
 */
export const getUserPurchaseTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const dateRange = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const trends = await OrderService.getUserPurchaseTrends(req.user.id, dateRange);

    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user purchase trends'
    });
  }
};
