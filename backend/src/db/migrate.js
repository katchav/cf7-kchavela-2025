const fs = require('fs').promises;
const path = require('path');
const { query, testConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Database migration utility
 */
class Migrator {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../../migrations');
  }

  /**
   * Get all migration files sorted by name
   * @returns {Promise<string[]>} Array of migration file paths
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => path.join(this.migrationsDir, file));
    } catch (error) {
      throw new Error(`Failed to read migrations directory: ${error.message}`);
    }
  }

  /**
   * Create migrations tracking table if it doesn't exist
   * @returns {Promise<void>}
   */
  async createMigrationsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await query(createTableQuery);
    logger.info('Migrations table ready');
  }

  /**
   * Get executed migrations
   * @returns {Promise<string[]>} Array of executed migration filenames
   */
  async getExecutedMigrations() {
    try {
      const result = await query('SELECT filename FROM migrations ORDER BY id');
      return result.rows.map(row => row.filename);
    } catch (error) {
      // If migrations table doesn't exist, return empty array
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Execute a single migration file
   * @param {string} filePath - Path to migration file
   * @returns {Promise<void>}
   */
  async executeMigration(filePath) {
    const filename = path.basename(filePath);
    
    try {
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Execute the migration
      await query(sql);
      
      // Record the migration as executed
      await query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      
      logger.info(`Migration executed: ${filename}`);
    } catch (error) {
      logger.error(`Failed to execute migration ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   * @returns {Promise<void>}
   */
  async migrate() {
    try {
      // Test database connection
      await testConnection();
      
      // Create migrations table
      await this.createMigrationsTable();
      
      // Get migration files and executed migrations
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      // Filter pending migrations
      const pendingMigrations = migrationFiles.filter(filePath => {
        const filename = path.basename(filePath);
        return !executedMigrations.includes(filename);
      });
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migrationPath of pendingMigrations) {
        await this.executeMigration(migrationPath);
      }
      
      logger.info('All migrations completed successfully');
      
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Show migration status
   * @returns {Promise<void>}
   */
  async status() {
    try {
      await testConnection();
      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      console.log('\nMigration Status:');
      console.log('================');
      
      migrationFiles.forEach(filePath => {
        const filename = path.basename(filePath);
        const status = executedMigrations.includes(filename) ? '[DONE]' : '[PENDING]';
        console.log(`${status} ${filename}`);
      });
      
      const pending = migrationFiles.length - executedMigrations.length;
      console.log(`\nTotal: ${migrationFiles.length}, Executed: ${executedMigrations.length}, Pending: ${pending}`);
      
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const migrator = new Migrator();
  const command = process.argv[2] || 'migrate';
  
  if (command === 'status') {
    migrator.status()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    migrator.migrate()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = Migrator;