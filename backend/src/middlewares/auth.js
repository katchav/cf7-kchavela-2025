const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const config = require('../config/app');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify the token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get fresh user data
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Attach user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Authorization middleware to check user roles
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await userRepository.findById(decoded.id);
        
        if (user) {
          req.user = user;
          req.token = token;
        }
      } catch (jwtError) {
        // Ignore JWT errors in optional auth
        logger.debug('Optional auth token invalid:', jwtError.message);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to ensure user owns the resource or is a librarian
 * @param {string} userIdParam - Parameter name containing user ID (default: 'userId')
 * @returns {Function} Middleware function
 */
const authorizeOwnerOrLibrarian = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Allow if user is a librarian or owns the resource
    if (req.user.role === 'librarian' || req.user.id === resourceUserId) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  };
};

/**
 * Middleware to check if user can access their own data or if librarian can access any data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authorizeSelfOrLibrarian = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  
  // Allow if user is accessing their own data or is a librarian
  if (req.user.id === targetUserId || req.user.role === 'librarian') {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied',
    code: 'ACCESS_DENIED'
  });
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  authorizeOwnerOrLibrarian,
  authorizeSelfOrLibrarian
};