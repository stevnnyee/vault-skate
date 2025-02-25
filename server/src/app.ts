/**
 * Main application entry point for the VAULT API
 * Sets up Express server with middleware, routes, and database connection
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import { errorMiddleware } from './middleware/error.middleware';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const port = process.env.PORT || 5000;

// Global Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Configure Helmet with less restrictive settings for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(morgan('dev'));
app.use(express.json());        // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req, res) => {
  res.send('VAULT API is running');
});

// Mount API Routes
app.use('/api/auth', authRoutes);       // Authentication routes
app.use('/api/products', productRoutes); // Product management routes
app.use('/api/orders', orderRoutes);     // Order management routes
app.use('/api/cart', cartRoutes);        // Shopping cart routes

// Error handling middleware (should be after all routes)
app.use(errorMiddleware);

/**
 * Server Startup Function
 * Connects to MongoDB and starts the Express server
 */
const startServer = async () => {
  try {
    await connectDB();  // Connect to MongoDB
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };