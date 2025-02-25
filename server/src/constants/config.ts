/**
 * Application Configuration Constants
 * Central configuration file that defines all environment-specific and
 * application-wide settings used across the application.
 */

/**
 * JWT (JSON Web Token) Configuration
 * Settings for token generation and validation
 * - SECRET: Used for signing and verifying tokens
 * - EXPIRES_IN: Token validity duration
 */
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EXPIRES_IN: '24h'
};

/**
 * Password Security Configuration
 * Defines password requirements and hashing settings
 * - SALT_ROUNDS: Number of bcrypt salt rounds for password hashing
 * - MIN_LENGTH: Minimum required password length
 * - PATTERN: Regex for password complexity requirements:
 *   - At least one lowercase letter
 *   - At least one uppercase letter
 *   - At least one number
 *   - At least one special character
 *   - Minimum length of 8 characters
 */
export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 10,
  MIN_LENGTH: 8,
  PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

/**
 * Pagination Settings
 * Default values for list endpoints pagination
 * - DEFAULT_PAGE: Starting page number for paginated results
 * - DEFAULT_LIMIT: Default number of items per page
 * - MAX_LIMIT: Maximum allowed items per page to prevent overloading
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * Security settings for handling cross-origin requests
 * - origin: Allowed origins for requests (defaults to all in development)
 * - methods: Allowed HTTP methods
 * - allowedHeaders: Headers that can be used in requests
 */
export const CORS_CONFIG = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * MongoDB Connection Configuration
 * Database connection settings and options
 * - URI: Connection string for MongoDB (falls back to local instance)
 * - OPTIONS: Mongoose connection options
 *   - useNewUrlParser: Use new URL string parser
 *   - useUnifiedTopology: Use new Server Discovery and Monitoring engine
 */
export const MONGODB_CONFIG = {
  URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/vault-skate',
  OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};
