const { query, getClient } = require('../config/database');
const User = require('../models/User');

/**
 * User repository for database operations
 */
class UserRepository {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User instance or null
   */
  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User instance or null
   */
  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  /**
   * Find user by reset token
   * @param {string} resetToken - Reset token
   * @returns {Promise<User|null>} User instance or null
   */
  async findByResetToken(resetToken) {
    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [resetToken]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user
   */
  async create(userData) {
    const { 
      email, 
      password_hash, 
      first_name, 
      last_name, 
      role, 
      max_books_allowed 
    } = userData;
    
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, max_books_allowed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email, password_hash, first_name, last_name, role, max_books_allowed || 10]
    );
    
    return new User(result.rows[0]);
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<User|null>} Updated user or null
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of results
   * @param {number} options.offset - Results offset
   * @param {string} options.role - Filter by role
   * @param {string} options.search - Search term for name/email
   * @returns {Promise<{users: User[], total: number}>} Users and total count
   */
  async findAll({ limit = 20, offset = 0, role = null, search = null }) {
    let countQuery = 'SELECT COUNT(*) FROM users';
    let selectQuery = 'SELECT * FROM users';
    const params = [];
    const conditions = [];
    
    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }
    
    if (search) {
      conditions.push(`(
        LOWER(first_name || ' ' || last_name) LIKE LOWER($${params.length + 1}) OR
        LOWER(email) LIKE LOWER($${params.length + 1})
      )`);
      params.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      countQuery += whereClause;
      selectQuery += whereClause;
    }
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    selectQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const users = result.rows.map(row => new User(row));
    
    return { users, total };
  }

  /**
   * Update refresh token
   * @param {string} id - User ID
   * @param {string} refreshToken - New refresh token
   * @returns {Promise<void>}
   */
  async updateRefreshToken(id, refreshToken) {
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, id]
    );
  }

  /**
   * Set password reset token
   * @param {string} id - User ID
   * @param {string} resetToken - Reset token
   * @param {Date} expiresAt - Token expiration
   * @returns {Promise<void>}
   */
  async setResetToken(id, resetToken, expiresAt) {
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expiresAt, id]
    );
  }

  /**
   * Clear reset token
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  async clearResetToken(id) {
    await query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
      [id]
    );
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'member') as total_members,
        COUNT(*) FILTER (WHERE role = 'librarian') as total_librarians,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_this_month
      FROM users
    `);
    
    return result.rows[0];
  }
}

module.exports = new UserRepository();