const { query } = require('../config/database');
const Category = require('../models/Category');

/**
 * Category repository for database operations
 */
class CategoryRepository {
  /**
   * Find category by ID
   * @param {string} id - Category ID
   * @param {boolean} includeBookCount - Include book count
   * @returns {Promise<Category|null>} Category instance or null
   */
  async findById(id, includeBookCount = false) {
    let categoryQuery = 'SELECT * FROM categories WHERE id = $1';
    
    if (includeBookCount) {
      categoryQuery = `
        SELECT 
          c.*,
          COUNT(bc.book_id) as book_count
        FROM categories c
        LEFT JOIN book_categories bc ON c.id = bc.category_id
        WHERE c.id = $1
        GROUP BY c.id
      `;
    }
    
    const result = await query(categoryQuery, [id]);
    return result.rows[0] ? new Category(result.rows[0]) : null;
  }

  /**
   * Find category by name
   * @param {string} name - Category name
   * @returns {Promise<Category|null>} Category instance or null
   */
  async findByName(name) {
    const result = await query('SELECT * FROM categories WHERE name = $1', [name]);
    return result.rows[0] ? new Category(result.rows[0]) : null;
  }

  /**
   * Create new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Category>} Created category
   */
  async create(categoryData) {
    const { name, description } = categoryData;
    
    const result = await query(`
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `, [name, description]);
    
    return new Category(result.rows[0]);
  }

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Category|null>} Updated category or null
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
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new Category(result.rows[0]) : null;
  }

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query('DELETE FROM categories WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get all categories with optional book counts
   * @param {Object} options - Query options
   * @returns {Promise<{categories: Category[], total: number}>} Categories and total count
   */
  async findAll({ 
    includeBookCount = false,
    limit = 50,
    offset = 0,
    search = null
  } = {}) {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(
        LOWER(name) LIKE LOWER($${paramCount}) OR 
        LOWER(description) LIKE LOWER($${paramCount})
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let selectQuery = 'SELECT * FROM categories';
    let countQuery = 'SELECT COUNT(*) FROM categories';

    if (includeBookCount) {
      selectQuery = `
        SELECT 
          c.*,
          COUNT(bc.book_id) as book_count
        FROM categories c
        LEFT JOIN book_categories bc ON c.id = bc.category_id
        ${whereClause}
        GROUP BY c.id
      `;
    } else if (whereClause) {
      selectQuery += ` ${whereClause}`;
    }

    if (whereClause) {
      countQuery += ` ${whereClause}`;
    }

    // Get total count
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get categories
    selectQuery += ` ORDER BY name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const categories = result.rows.map(row => new Category(row));

    return { categories, total };
  }

  /**
   * Get categories with their book counts
   * @returns {Promise<Category[]>} Categories with book counts
   */
  async getCategoriesWithBookCount() {
    const result = await query(`
      SELECT 
        c.*,
        COUNT(bc.book_id) as book_count
      FROM categories c
      LEFT JOIN book_categories bc ON c.id = bc.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return result.rows.map(row => new Category(row));
  }

  /**
   * Get popular categories (by book count)
   * @param {number} limit - Number of categories to return
   * @returns {Promise<Category[]>} Popular categories
   */
  async getPopularCategories(limit = 10) {
    const result = await query(`
      SELECT 
        c.*,
        COUNT(bc.book_id) as book_count
      FROM categories c
      LEFT JOIN book_categories bc ON c.id = bc.category_id
      GROUP BY c.id
      HAVING COUNT(bc.book_id) > 0
      ORDER BY book_count DESC, c.name ASC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => new Category(row));
  }

  /**
   * Get categories for dropdown/select options
   * @returns {Promise<Array>} Category options
   */
  async getCategoryOptions() {
    const result = await query(`
      SELECT id, name
      FROM categories
      ORDER BY name ASC
    `);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      value: row.id,
      label: row.name
    }));
  }

  /**
   * Check if category has associated books
   * @param {string} id - Category ID
   * @returns {Promise<boolean>} True if category has books
   */
  async hasBooks(id) {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM book_categories
      WHERE category_id = $1
    `, [id]);

    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get category statistics
   * @returns {Promise<Object>} Category statistics
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_categories,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM book_categories bc WHERE bc.category_id = categories.id
          )
        ) as categories_with_books,
        AVG(book_counts.book_count) as avg_books_per_category
      FROM categories,
      LATERAL (
        SELECT COUNT(*) as book_count
        FROM book_categories bc
        WHERE bc.category_id = categories.id
      ) book_counts
    `);
    
    return result.rows[0];
  }
}

module.exports = new CategoryRepository();