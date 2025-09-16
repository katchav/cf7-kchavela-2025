#!/usr/bin/env node

/**
 * Library Management System Server
 * Coding Factory 7 Project by Aikaterini Chavela
 */

const http = require('http');
const createApp = require('./app');
const config = require('./config/app');
const logger = require('./utils/logger');
const { testConnection, closePool } = require('./config/database');

/**
 * Create HTTP server
 */
async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await testConnection();
    logger.info('Database connection established');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Server configuration
    server.setTimeout(30000); // 30 seconds timeout

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.port === 'string'
        ? `Pipe ${config.port}`
        : `Port ${config.port}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle server listening
    server.on('listening', () => {
      const addr = server.address();
      const bind = typeof addr === 'string'
        ? `pipe ${addr}`
        : `port ${addr.port}`;

      logger.info(`Library Management System API started`);
      logger.info(`Server listening on ${bind}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health Check: http://localhost:${config.port}/health`);
      
      // Log test accounts information
      logger.info('\nTest Accounts:');
      logger.info('Librarian: librarian@library.com / LibPass123!');
      logger.info('Member: member@library.com / MemPass123!');
      logger.info('Aikaterini: aikaterini.chavela@library.com / AikaPass123!');
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received, starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }

        logger.info('HTTP server closed');

        try {
          // Close database connections
          await closePool();
          logger.info('Database connections closed');
          
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (dbError) {
          logger.error('Error closing database connections:', dbError);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('WARNING: Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Start listening
    server.listen(config.port, () => {
      // Server started event will be handled by the 'listening' event handler
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer };