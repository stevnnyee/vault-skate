/**
 * Order Routes
 * Defines all order-related API endpoints.
 * 
 * Route Categories:
 * 1. Order Creation
 *    - POST /: Create new order
 *    - Requires authentication
 *    - Validates order data
 * 
 * 2. Order Management (Admin)
 *    - PATCH /:id/status: Update order status
 *    - PATCH /:id/payment: Update payment status
 *    - Requires admin privileges
 *    - Validates status transitions
 * 
 * 3. Order Retrieval
 *    - GET /:id: Get single order
 *    - GET /: List orders with filters
 *    - Access control based on user role
 * 
 * 4. Order History & Analytics
 *    - GET /history: View order history
 *    - GET /analytics: Get order statistics
 *    - GET /trends: View purchase trends
 * 
 * Middleware Integration:
 * - Authentication checks
 * - Role-based authorization
 * - Request validation
 * - Error handling
 * 
 * Security Features:
 * - JWT authentication
 * - Role-based access control
 * - Input validation
 * - Request sanitization
 * 
 * Response Formats:
 * - Consistent success/error structure
 * - Appropriate HTTP status codes
 * - Detailed error messages
 * - Paginated results where applicable
 */

import { Router, Request, Response } from 'express';
import { createOrder } from '../controllers/order/create';
import { getOrderById, getOrders } from '../controllers/order/get';
import { updateOrderStatus, updatePaymentStatus } from '../controllers/order/update';
import { getOrderHistory, getOrderAnalytics, getUserPurchaseTrends } from '../controllers/order/history';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types/models/user.types';
import { validate } from '../middleware/validation/order.validation';

const router = Router();

/**
 * Order Creation Routes
 * Handles new order submission and validation
 */
router.post('/',
  authenticate,
  validate('createOrder'),
  (req: Request, res: Response) => createOrder(req, res)
);

/**
 * Order Management Routes (Admin Only)
 * Handles order status and payment updates
 */
router.patch('/:id/status',
  authenticate,
  authorize([UserRole.ADMIN]),
  validate('updateOrderStatus'),
  (req: Request, res: Response) => updateOrderStatus(req, res)
);

router.patch('/:id/payment',
  authenticate,
  authorize([UserRole.ADMIN]),
  validate('updatePaymentStatus'),
  (req: Request, res: Response) => updatePaymentStatus(req, res)
);

/**
 * Order History and Analytics Routes
 * Handles historical data and statistical analysis
 */
router.get('/history',
  authenticate,
  validate('getOrderHistory'),
  (req: Request, res: Response) => getOrderHistory(req, res)
);

router.get('/analytics',
  authenticate,
  authorize([UserRole.ADMIN]),
  validate('getOrderAnalytics'),
  (req: Request, res: Response) => getOrderAnalytics(req, res)
);

router.get('/trends',
  authenticate,
  validate('getUserPurchaseTrends'),
  (req: Request, res: Response) => getUserPurchaseTrends(req, res)
);

/**
 * Order Retrieval Routes
 * Handles fetching single orders and order lists
 */
router.get('/:id',
  authenticate,
  validate('getOrderById'),
  (req: Request, res: Response) => getOrderById(req, res)
);

router.get('/',
  authenticate,
  validate('getOrders'),
  (req: Request, res: Response) => getOrders(req, res)
);

export default router;
