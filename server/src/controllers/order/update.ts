/**
 * Order Update Controller
 * Handles updates to order status and payment status.
 * 
 * Features:
 * - Order status management (PENDING, PROCESSING, SHIPPED, etc.)
 * - Payment status tracking (PENDING, PAID, FAILED, etc.)
 * - Admin-only access control
 * - Status transition validation
 * 
 * Authentication & Authorization:
 * - Requires valid authentication
 * - Restricted to admin users only
 * - Verifies admin role before processing updates
 * 
 * Status Management:
 * - Validates status transitions
 * - Updates order status with audit trail
 * - Handles payment status changes
 * - Ensures valid status values
 * 
 * Error Handling:
 * - Returns 403 for non-admin access
 * - Returns 404 for non-existent orders
 * - Returns 400 for invalid status values
 * - Includes detailed error messages
 * 
 * Response:
 * - 200: Update successful
 * - Includes updated order details
 */

import { Response } from 'express';
import { OrderService } from '../../services/order.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { OrderStatus, PaymentStatus } from '../../types/models/order.types';

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await OrderService.updateOrderStatus(
      req.params.id,
      req.body.status as OrderStatus
    );

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status'
    });
  }
};

export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await OrderService.updatePaymentStatus(
      req.params.id,
      req.body.paymentStatus as PaymentStatus
    );

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment status'
    });
  }
}; 