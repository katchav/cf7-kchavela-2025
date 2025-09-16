const { query, getClient } = require('../config/database');
const BookLoan = require('../models/BookLoan');
const Book = require('../models/Book');
const User = require('../models/User');

/**
 * BookLoan repository for database operations
 */
class BookLoanRepository {
  /**
   * Find loan by ID with optional book and user information
   * @param {string} id - Loan ID
   * @param {boolean} includeRelations - Include book and user data
   * @returns {Promise<BookLoan|null>} BookLoan instance or null
   */
  async findById(id, includeRelations = true) {
    let loanQuery = 'SELECT * FROM book_loans WHERE id = $1';
    
    if (includeRelations) {
      loanQuery = `
        SELECT 
          bl.*,
          b.title as book_title,
          b.author as book_author,
          b.isbn as book_isbn,
          b.cover_image_url as book_cover,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
        FROM book_loans bl
        LEFT JOIN books b ON bl.book_id = b.id
        LEFT JOIN users u ON bl.user_id = u.id
        WHERE bl.id = $1
      `;
    }
    
    const result = await query(loanQuery, [id]);
    return result.rows[0] ? new BookLoan(result.rows[0]) : null;
  }

  /**
   * Create new loan
   * @param {Object} loanData - Loan data
   * @returns {Promise<BookLoan>} Created loan
   */
  async create(loanData) {
    const {
      book_id,
      user_id,
      loan_date,
      due_date,
      status = 'active',
      notes
    } = loanData;

    const result = await query(`
      INSERT INTO book_loans (book_id, user_id, loan_date, due_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [book_id, user_id, loan_date, due_date, status, notes]);

    return new BookLoan(result.rows[0]);
  }

  /**
   * Update loan
   * @param {string} id - Loan ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<BookLoan|null>} Updated loan or null
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
      `UPDATE book_loans SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new BookLoan(result.rows[0]) : null;
  }

  /**
   * Get active loans for a user
   * @param {string} userId - User ID
   * @returns {Promise<BookLoan[]>} Active loans
   */
  async getActiveByUser(userId) {
    const result = await query(`
      SELECT 
        bl.*,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn,
        b.cover_image_url as book_cover
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      WHERE bl.user_id = $1 AND bl.status = 'active'
      ORDER BY bl.due_date ASC
    `, [userId]);

    return result.rows.map(row => new BookLoan(row));
  }

  /**
   * Get loan history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<{loans: BookLoan[], total: number}>} User's loan history
   */
  async getUserLoans(userId, { limit = 20, offset = 0, status = null }) {
    const conditions = ['bl.user_id = $1'];
    const params = [userId];
    let paramCount = 2;

    if (status) {
      conditions.push(`bl.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM book_loans bl 
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Main query
    const selectQuery = `
      SELECT 
        bl.*,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn,
        b.cover_image_url as book_cover
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      ${whereClause}
      ORDER BY bl.loan_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const loans = result.rows.map(row => new BookLoan(row));

    return { loans, total };
  }

  /**
   * Get all loans with optional filters
   * @param {Object} options - Query options
   * @returns {Promise<{loans: BookLoan[], total: number}>} Loans and total count
   */
  async findAll({
    status = null,
    user_id = null,
    book_id = null,
    overdue_only = false,
    limit = 20,
    offset = 0,
    sort_by = 'loan_date',
    sort_order = 'DESC'
  }) {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`bl.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (user_id) {
      conditions.push(`bl.user_id = $${paramCount}`);
      params.push(user_id);
      paramCount++;
    }

    if (book_id) {
      conditions.push(`bl.book_id = $${paramCount}`);
      params.push(book_id);
      paramCount++;
    }

    if (overdue_only) {
      conditions.push(`(bl.status = 'overdue' OR (bl.status = 'active' AND bl.due_date < NOW()))`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM book_loans bl 
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Validate sort parameters
    const validSortFields = ['loan_date', 'due_date', 'return_date', 'status', 'created_at'];
    const validSortOrder = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'loan_date';
    const sortDirection = validSortOrder.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    // Main query
    const selectQuery = `
      SELECT 
        bl.*,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn,
        b.cover_image_url as book_cover,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      JOIN users u ON bl.user_id = u.id
      ${whereClause}
      ORDER BY bl.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const loans = result.rows.map(row => new BookLoan(row));

    return { loans, total };
  }

  /**
   * Get overdue loans
   * @param {Object} options - Query options
   * @returns {Promise<BookLoan[]>} Overdue loans
   */
  async getOverdueLoans({ limit = 50 } = {}) {
    const result = await query(`
      SELECT 
        bl.*,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        EXTRACT(DAY FROM (NOW() - bl.due_date))::INTEGER as days_overdue
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      JOIN users u ON bl.user_id = u.id
      WHERE bl.status = 'active' AND bl.due_date < NOW()
      ORDER BY bl.due_date ASC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => new BookLoan(row));
  }

  /**
   * Check if user has an active loan for a specific book
   * @param {string} userId - User ID
   * @param {string} bookId - Book ID
   * @returns {Promise<BookLoan|null>} Active loan or null
   */
  async findActiveUserBookLoan(userId, bookId) {
    const result = await query(`
      SELECT * FROM book_loans 
      WHERE user_id = $1 AND book_id = $2 AND status = 'active'
    `, [userId, bookId]);

    return result.rows[0] ? new BookLoan(result.rows[0]) : null;
  }

  /**
   * Return a book (update loan status and set return date)
   * @param {string} loanId - Loan ID
   * @param {Date} returnDate - Return date
   * @param {string} notes - Optional notes
   * @returns {Promise<BookLoan|null>} Updated loan or null
   */
  async returnBook(loanId, returnDate = new Date(), notes = null) {
    const updates = {
      status: 'returned',
      return_date: returnDate
    };

    if (notes) {
      updates.notes = notes;
    }

    return await this.update(loanId, updates);
  }

  /**
   * Mark loans as overdue
   * @returns {Promise<number>} Number of loans marked as overdue
   */
  async markOverdueLoans() {
    const result = await query(`
      UPDATE book_loans 
      SET status = 'overdue' 
      WHERE status = 'active' AND due_date < NOW()
      RETURNING id
    `);

    return result.rowCount;
  }

  /**
   * Get loan statistics
   * @returns {Promise<Object>} Loan statistics
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(*) FILTER (WHERE status = 'active') as active_loans,
        COUNT(*) FILTER (WHERE status = 'returned') as returned_loans,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_loans,
        COUNT(*) FILTER (WHERE status = 'active' AND due_date < NOW()) as newly_overdue,
        COUNT(*) FILTER (WHERE loan_date >= NOW() - INTERVAL '30 days') as loans_this_month,
        AVG(EXTRACT(DAY FROM (return_date - loan_date)))::INTEGER as avg_loan_duration,
        COUNT(DISTINCT user_id) as active_borrowers,
        COUNT(DISTINCT book_id) as borrowed_books
      FROM book_loans
    `);
    
    return result.rows[0];
  }

  /**
   * Get most borrowed books
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Most borrowed books with counts
   */
  async getMostBorrowedBooks({ limit = 10, period_days = 30 } = {}) {
    const result = await query(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        COUNT(bl.id) as borrow_count
      FROM books b
      JOIN book_loans bl ON b.id = bl.book_id
      WHERE bl.loan_date >= NOW() - INTERVAL '${period_days} days'
      GROUP BY b.id, b.title, b.author, b.isbn
      ORDER BY borrow_count DESC, b.title ASC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Get member loan history summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Member loan summary
   */
  async getMemberLoanSummary(userId) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(*) FILTER (WHERE status = 'active') as active_loans,
        COUNT(*) FILTER (WHERE status = 'returned') as returned_loans,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_loans,
        AVG(EXTRACT(DAY FROM (COALESCE(return_date, NOW()) - loan_date)))::INTEGER as avg_loan_duration,
        MAX(loan_date) as last_loan_date,
        COUNT(DISTINCT book_id) as unique_books_borrowed
      FROM book_loans
      WHERE user_id = $1
    `, [userId]);
    
    return result.rows[0];
  }

  /**
   * Delete loan (for cleanup or admin purposes)
   * @param {string} id - Loan ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query('DELETE FROM book_loans WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

module.exports = new BookLoanRepository();