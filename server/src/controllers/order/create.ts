/**
 * Order Creation Controller
 * Handles the creation of new orders in the system.
 * 
 * Features:
 * - Creates new orders for authenticated users
 * - Validates order data (items, addresses)
 * - Processes order through OrderService
 * - Returns created order details
 * 
 * Authentication:
 * - Requires valid user authentication
 * - Available to all authenticated users (customers and admins)
 * 
 * Request Processing:
 * - Validates user authentication
 * - Processes order creation through OrderService
 * - Returns newly created order data
 * 
 * Error Handling:
 * - Returns 401 for unauthenticated requests
 * - Returns 400 for validation errors
 * - Includes detailed error messages
 * 
 * Response:
 * - 201: Order created successfully
 * - Includes complete order details in response
 */

import { Request, Response } from 'express';
import { OrderService } from '../../services/order.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CreateOrderInput } from '../../types/services/order.service.types';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const orderData: CreateOrderInput = {
      items: req.body.items,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
      paymentMethod: req.body.paymentMethod,
      shippingMethod: req.body.shippingMethod
    };

    const order = await OrderService.createOrder(req.user.id, orderData);

    return res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    });
  }
};
