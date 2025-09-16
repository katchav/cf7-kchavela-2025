const logger = require('../utils/logger');
const config = require('../config/app');

/**
 * Error handling middleware
 */

/**
 * Handle 404 - Not Found
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Global error handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (error, req, res, next) => {
  // Default to 500 if no status code is set
  const statusCode = error.status || error.statusCode || 500;
  
  // Log error details
  const errorInfo = {
    message: error.message,
    status: statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    stack: error.stack
  };

  if (statusCode >= 500) {
    logger.error('Server error', errorInfo);
  } else if (statusCode >= 400) {
    logger.warn('Client error', errorInfo);
  }

  // Don't expose error details in production
  const isDevelopment = config.env === 'development';
  
  // Database constraint errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
      ...(isDevelopment && { details: error.detail })
    });
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      error: 'Invalid reference to related resource',
      code: 'INVALID_REFERENCE',
      ...(isDevelopment && { details: error.detail })
    });
  }

  if (error.code === '23514') { // Check constraint violation
    return res.status(400).json({
      error: 'Data validation failed',
      code: 'VALIDATION_ERROR',
      ...(isDevelopment && { details: error.detail })
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Validation errors from express-validator
  if (error.type === 'validation') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.details
    });
  }

  // Rate limiting errors
  if (error.type === 'rate-limit') {
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: error.retryAfter
    });
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }

  // Default error response
  const response = {
    error: statusCode >= 500 ? 'Internal server error' : error.message,
    code: error.code || 'UNKNOWN_ERROR'
  };

  // Add additional information in development
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error.details;
    
    if (statusCode >= 500) {
      response.originalMessage = error.message;
    }
  }

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Error} Custom error
 */
const createError = (message, statusCode = 500, code = 'UNKNOWN_ERROR', details = null) => {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  error.code = code;
  
  if (details) {
    error.details = details;
  }
  
  return error;
};

/**
 * Handle database connection errors
 * @param {Error} error - Database error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handleDatabaseError = (error, req, res, next) => {
  if (error.code === 'ECONNREFUSED') {
    logger.error('Database connection refused', {
      host: error.hostname,
      port: error.port,
      url: req.originalUrl
    });
    
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });
  }

  if (error.code === 'ETIMEDOUT') {
    logger.error('Database connection timeout', {
      url: req.originalUrl,
      timeout: error.timeout
    });
    
    return res.status(504).json({
      error: 'Request timeout',
      code: 'DATABASE_TIMEOUT'
    });
  }

  next(error);
};

/**
 * Handle payload too large errors
 * @param {Error} error - Payload error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handlePayloadError = (error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      code: 'INVALID_JSON'
    });
  }

  next(error);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  createError,
  handleDatabaseError,
  handlePayloadError
};