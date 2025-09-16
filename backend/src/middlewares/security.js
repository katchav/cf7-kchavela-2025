const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/app');
const logger = require('../utils/logger');

/**
 * Security middleware configuration
 */

/**
 * Configure Helmet for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.env === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding
});

/**
 * Rate limiting configurations
 */

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      error: 'Too many requests from this IP',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  }
});

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.rateLimit.auth.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful requests too
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts from this IP',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimit.auth.windowMs / 1000)
    });
  }
});

// More permissive rate limit for book browsing
const browseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Allow 200 requests per minute for browsing
  message: {
    error: 'Too many browse requests',
    code: 'BROWSE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for librarians
    return req.user && req.user.role === 'librarian';
  }
});

/**
 * Input sanitization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object properties
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Request size limiter
 * @param {string} maxSize - Maximum request size (default: '10mb')
 * @returns {Function} Middleware function
 */
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      logger.warn('Request payload too large', {
        contentLength,
        maxBytes,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      return res.status(413).json({
        error: 'Request payload too large',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize
      });
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 * @param {string} sizeStr - Size string (e.g., '10mb', '1gb')
 * @returns {number} Size in bytes
 */
const parseSize = (sizeStr) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = sizeStr.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  if (!match) return 0;
  
  const [, size, unit] = match;
  return parseInt(size) * units[unit];
};

/**
 * IP whitelist middleware
 * @param {string[]} allowedIPs - Array of allowed IP addresses
 * @returns {Function} Middleware function
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    logger.warn('IP not whitelisted', {
      ip: clientIP,
      allowedIPs,
      endpoint: req.originalUrl
    });
    
    res.status(403).json({
      error: 'Access denied',
      code: 'IP_NOT_ALLOWED'
    });
  };
};

/**
 * Request logging middleware for security events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const securityLogger = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /union.*select/i,
    /script.*alert/i,
    /javascript:/i,
    /<script>/i,
    /\.\.\/\.\.\//,
    /\/etc\/passwd/i,
    /\/proc\/version/i
  ];
  
  const checkSuspicious = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };
  
  const requestData = {
    ...req.query,
    ...req.body,
    ...req.params
  };
  
  const hasSuspiciousContent = Object.values(requestData).some(checkSuspicious);
  
  if (hasSuspiciousContent) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      data: requestData
    });
  }
  
  next();
};

module.exports = {
  helmetConfig,
  apiLimiter,
  authLimiter,
  browseLimiter,
  sanitizeInput,
  requestSizeLimiter,
  ipWhitelist,
  securityLogger
};