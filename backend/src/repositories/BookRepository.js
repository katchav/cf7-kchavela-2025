const { query, getClient } = require('../config/database');
const Book = require('../models/Book');

// Book repository - handles database stuff for books
class BookRepository {
  // Find book by ID
  async findById(id, includeCategories = false) {
    let bookQuery = 'SELECT * FROM books WHERE id = $1';
    let bookResult = await query(bookQuery, [id]);
    
    if (!bookResult.rows[0]) {
      return null;
    }
    
    const bookData = bookResult.rows[0];
    
    if (includeCategories) {
      const categoriesResult = await query(`
        SELECT c.id, c.name, c.description
        FROM categories c
        JOIN book_categories bc ON c.id = bc.category_id
        WHERE bc.book_id = $1
        ORDER BY c.name
      `, [id]);
      
      bookData.categories = categoriesResult.rows;
    }
    
    return new Book(bookData);
  }

  // Find book by ISBN
  async findByIsbn(isbn) {
    const result = await query('SELECT * FROM books WHERE isbn = $1', [isbn]);
    return result.rows[0] ? new Book(result.rows[0]) : null;
  }

  /**
   * Create new book
   * @param {Object} bookData - Book data
   * @returns {Promise<Book>} Created book
   */
  async create(bookData) {
    const {
      isbn,
      title,
      author,
      publisher,
      publication_year,
      description,
      cover_image_url,
      total_copies = 1,
      available_copies
    } = bookData;

    const result = await query(`
      INSERT INTO books (
        isbn, title, author, publisher, publication_year, 
        description, cover_image_url, total_copies, available_copies
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      isbn, title, author, publisher, publication_year,
      description, cover_image_url, total_copies, 
      available_copies !== undefined ? available_copies : total_copies
    ]);

    return new Book(result.rows[0]);
  }

  /**
   * Update book
   * @param {string} id - Book ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Book|null>} Updated book or null
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
      `UPDATE books SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new Book(result.rows[0]) : null;
  }

  /**
   * Delete book
   * @param {string} id - Book ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query('DELETE FROM books WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Search books with filters and pagination
   * @param {Object} options - Search options
   * @returns {Promise<{books: Book[], total: number}>} Books and total count
   */
  async searchBooks({
    search = null,
    author = null,
    publisher = null,
    category = null,
    year_from = null,
    year_to = null,
    available_only = false,
    limit = 20,
    offset = 0,
    sort_by = 'title',
    sort_order = 'ASC'
  }) {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Build base query with category joins
    let baseQuery = `
      FROM books b
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
    `;

    // Search in title, author, description
    if (search) {
      conditions.push(`(
        b.title ILIKE $${paramCount} OR 
        b.author ILIKE $${paramCount} OR 
        b.description ILIKE $${paramCount} OR
        to_tsvector('english', b.title || ' ' || b.author || ' ' || COALESCE(b.description, '')) @@ plainto_tsquery('english', $${paramCount})
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filter by author
    if (author) {
      conditions.push(`b.author ILIKE $${paramCount}`);
      params.push(`%${author}%`);
      paramCount++;
    }

    // Filter by publisher
    if (publisher) {
      conditions.push(`b.publisher ILIKE $${paramCount}`);
      params.push(`%${publisher}%`);
      paramCount++;
    }

    // Filter by category
    if (category) {
      // Use exact match for category name and ensure the join produces results
      conditions.push(`EXISTS (
        SELECT 1 FROM book_categories bc2
        JOIN categories c2 ON bc2.category_id = c2.id
        WHERE bc2.book_id = b.id AND c2.name = $${paramCount}
      )`);
      params.push(category);
      paramCount++;
    }

    // Filter by publication year range
    if (year_from) {
      conditions.push(`b.publication_year >= $${paramCount}`);
      params.push(year_from);
      paramCount++;
    }

    if (year_to) {
      conditions.push(`b.publication_year <= $${paramCount}`);
      params.push(year_to);
      paramCount++;
    }

    // Filter available books only
    if (available_only) {
      conditions.push('b.available_copies > 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT b.id) ${baseQuery} ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Validate sort parameters
    const validSortFields = ['title', 'author', 'publisher', 'publication_year', 'created_at', 'available_copies'];
    const validSortOrder = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'title';
    const sortDirection = validSortOrder.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

    // Main query with aggregated categories
    const selectQuery = `
      SELECT 
        b.*,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'
        ) as categories
      ${baseQuery}
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const books = result.rows.map(row => {
      const bookData = { ...row };
      if (typeof bookData.categories === 'string') {
        bookData.categories = JSON.parse(bookData.categories);
      }
      return new Book(bookData);
    });

    return { books, total };
  }

  /**
   * Get books by category
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<{books: Book[], total: number}>} Books and total count
   */
  async findByCategory(categoryId, { limit = 20, offset = 0, available_only = false }) {
    const conditions = ['bc.category_id = $1'];
    const params = [categoryId];
    let paramCount = 2;

    if (available_only) {
      conditions.push('b.available_copies > 0');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT b.id)
      FROM books b
      JOIN book_categories bc ON b.id = bc.book_id
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Main query
    const selectQuery = `
      SELECT DISTINCT b.*
      FROM books b
      JOIN book_categories bc ON b.id = bc.book_id
      ${whereClause}
      ORDER BY b.title ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const books = result.rows.map(row => new Book(row));

    return { books, total };
  }

  /**
   * Update available copies (for borrowing/returning)
   * @param {string} bookId - Book ID
   * @param {number} change - Change in available copies (+1 for return, -1 for borrow)
   * @returns {Promise<Book|null>} Updated book or null
   */
  async updateAvailableCopies(bookId, change) {
    const result = await query(`
      UPDATE books 
      SET available_copies = available_copies + $1 
      WHERE id = $2 AND available_copies + $1 >= 0 AND available_copies + $1 <= total_copies
      RETURNING *
    `, [change, bookId]);
    
    return result.rows[0] ? new Book(result.rows[0]) : null;
  }

  /**
   * Get most popular books based on borrowing history
   * @param {Object} options - Query options
   * @returns {Promise<Book[]>} Popular books
   */
  async getMostPopular({ limit = 10, period_days = 30 }) {
    const result = await query(`
      SELECT 
        b.*,
        COUNT(bl.id) as borrow_count,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'
        ) as categories
      FROM books b
      LEFT JOIN book_loans bl ON b.id = bl.book_id 
        AND bl.loan_date >= NOW() - INTERVAL '${period_days} days'
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
      GROUP BY b.id
      HAVING COUNT(bl.id) > 0
      ORDER BY borrow_count DESC, b.title ASC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => {
      const bookData = { ...row };
      if (typeof bookData.categories === 'string') {
        bookData.categories = JSON.parse(bookData.categories);
      }
      return new Book(bookData);
    });
  }

  /**
   * Get recently added books
   * @param {Object} options - Query options
   * @returns {Promise<Book[]>} Recent books
   */
  async getRecentlyAdded({ limit = 10, available_only = false }) {
    const conditions = available_only ? 'WHERE b.available_copies > 0' : '';
    
    const result = await query(`
      SELECT 
        b.*,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ) FILTER (WHERE c.id IS NOT NULL), 
          '[]'
        ) as categories
      FROM books b
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
      ${conditions}
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => {
      const bookData = { ...row };
      if (typeof bookData.categories === 'string') {
        bookData.categories = JSON.parse(bookData.categories);
      }
      return new Book(bookData);
    });
  }

  /**
   * Get book statistics
   * @returns {Promise<Object>} Book statistics
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_books,
        SUM(total_copies) as total_copies,
        SUM(available_copies) as available_copies,
        COUNT(*) FILTER (WHERE available_copies > 0) as available_books,
        COUNT(*) FILTER (WHERE available_copies = 0) as unavailable_books,
        COUNT(DISTINCT author) as unique_authors,
        COUNT(DISTINCT publisher) as unique_publishers,
        AVG(publication_year) as avg_publication_year,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_books_this_month
      FROM books
    `);
    
    return result.rows[0];
  }

  /**
   * Add categories to a book
   * @param {string} bookId - Book ID
   * @param {string[]} categoryIds - Array of category IDs
   * @returns {Promise<void>}
   */
  async addCategories(bookId, categoryIds) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Remove existing categories
      await client.query('DELETE FROM book_categories WHERE book_id = $1', [bookId]);
      
      // Add new categories
      for (const categoryId of categoryIds) {
        await client.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)',
          [bookId, categoryId]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new BookRepository();