const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');
const config = require('./app');

// Get database configuration based on environment
const getDatabaseConfig = () => {
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'library_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  };
  
  // Test environment configuration
  if (config.env === 'test' || process.env.NODE_ENV === 'test') {
    return {
      ...baseConfig,
      database: process.env.TEST_DB_NAME || 'library_test_db',
      max: 5, // Smaller pool for tests
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 1000,
      // Disable logging for cleaner test output
      application_name: 'library-backend-test'
    };
  }
  
  if (config.env === 'production') {
    const prodConfig = require('./production').database;
    return {
      ...baseConfig,
      ...prodConfig,
      // Production-specific settings
      statement_timeout: 30000, // 30 seconds
      query_timeout: 30000,
      application_name: 'library-backend',
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    };
  }
  
  // Development configuration
  return {
    ...baseConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };
};

// Database connection pool
const pool = new Pool(getDatabaseConfig());

// Pool event handlers
pool.on('connect', (client) => {
  if (config.env === 'development') {
    logger.debug('New database client connected');
  }
});

pool.on('error', (err, client) => {
  logger.error('Unexpected database error on idle client', { error: err });
});

pool.on('remove', (client) => {
  if (config.env === 'development') {
    logger.debug('Database client removed');
  }
});

// Test if database connects ok
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    client.release();
    logger.info('Database connected successfully', {
      timestamp: result.rows[0].now,
      poolStats
    });
  } catch (error) {
    logger.error('Database connection error', {
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

// Run a database query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
    } else if (duration > 1000) {
      // Log slow queries in production
      logger.warn('Slow query detected', {
        text: text.substring(0, 100) + '...',
        duration,
        rows: res.rowCount
      });
    }
    
    return res;
  } catch (error) {
    logger.error('Database query error', {
      query: text.substring(0, 100) + '...',
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
const getClient = () => {
  return pool.connect();
};

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
};

/**
 * Gracefully close database connections
 * @returns {Promise<void>}
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed gracefully');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
    throw error;
  }
};

/**
 * Create test database if it doesn't exist
 * @returns {Promise<void>}
 */
const createTestDatabase = async () => {
  if (config.env !== 'test' && process.env.NODE_ENV !== 'test') {
    throw new Error('createTestDatabase can only be called in test environment');
  }
  
  const mainDbConfig = {
    ...getDatabaseConfig(),
    database: 'postgres' // Connect to default postgres database
  };
  
  const mainPool = new Pool(mainDbConfig);
  const testDbName = process.env.TEST_DB_NAME || 'library_test_db';
  
  try {
    // Check if test database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const result = await mainPool.query(checkDbQuery, [testDbName]);
    
    if (result.rows.length === 0) {
      // Create test database
      await mainPool.query(`CREATE DATABASE "${testDbName}"`);
      logger.info(`Test database '${testDbName}' created`);
    }
  } catch (error) {
    logger.error('Error creating test database:', error);
    throw error;
  } finally {
    await mainPool.end();
  }
};

/**
 * Drop test database
 * @returns {Promise<void>}
 */
const dropTestDatabase = async () => {
  if (config.env !== 'test' && process.env.NODE_ENV !== 'test') {
    throw new Error('dropTestDatabase can only be called in test environment');
  }
  
  const mainDbConfig = {
    ...getDatabaseConfig(),
    database: 'postgres' // Connect to default postgres database
  };
  
  const mainPool = new Pool(mainDbConfig);
  const testDbName = process.env.TEST_DB_NAME || 'library_test_db';
  
  try {
    // Terminate connections to test database
    await mainPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid != pg_backend_pid()
    `, [testDbName]);
    
    // Drop test database
    await mainPool.query(`DROP DATABASE IF EXISTS "${testDbName}"`);
    logger.info(`Test database '${testDbName}' dropped`);
  } catch (error) {
    logger.error('Error dropping test database:', error);
    throw error;
  } finally {
    await mainPool.end();
  }
};

/**
 * Clean all tables in test database
 * @returns {Promise<void>}
 */
const cleanTestDatabase = async () => {
  if (config.env !== 'test' && process.env.NODE_ENV !== 'test') {
    throw new Error('cleanTestDatabase can only be called in test environment');
  }
  
  try {
    // Get all table names (excluding migrations table)
    const tablesResult = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'migrations'
      ORDER BY tablename
    `);
    
    if (tablesResult.rows.length > 0) {
      // Disable foreign key checks temporarily
      await query('SET session_replication_role = replica');
      
      // Truncate all tables
      const tableNames = tablesResult.rows.map(row => `"${row.tablename}"`).join(', ');
      await query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
      
      // Re-enable foreign key checks
      await query('SET session_replication_role = DEFAULT');
      
      logger.debug(`Cleaned ${tablesResult.rows.length} tables in test database`);
    }
  } catch (error) {
    logger.error('Error cleaning test database:', error);
    throw error;
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections');
  await closePool();
});

module.exports = {
  pool,
  testConnection,
  query,
  getClient,
  getPoolStats,
  closePool,
  createTestDatabase,
  dropTestDatabase,
  cleanTestDatabase,
  getDatabaseConfig
};