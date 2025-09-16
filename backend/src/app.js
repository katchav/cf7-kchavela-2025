const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import configuration and utilities
const config = require('./config/app');
const logger = require('./utils/logger');

// Import middleware
const {
  helmetConfig,
  apiLimiter,
  sanitizeInput,
  securityLogger
} = require('./middlewares/security');

const {
  notFound,
  errorHandler,
  handleDatabaseError,
  handlePayloadError
} = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const loanRoutes = require('./routes/loans');
const categoryRoutes = require('./routes/categories');

/**
 * Create Express application
 */
function createApp() {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmetConfig);
  app.use(securityLogger);
  app.use(sanitizeInput);

  // CORS configuration
  app.use(cors(config.cors));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Compression and logging
  app.use(compression());
  
  // HTTP request logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));
  }

  // API rate limiting - temporarily disabled for testing
  // app.use('/api/', apiLimiter);

  // Error handling for payload and database issues
  app.use(handlePayloadError);
  app.use(handleDatabaseError);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/categories', categoryRoutes);


  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Library Management System API',
      version: '1.0.0',
      environment: config.env,
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        books: '/api/books',
        loans: '/api/loans',
        categories: '/api/categories'
      }
    });
  });

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
}

module.exports = createApp;