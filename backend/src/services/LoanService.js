const bookLoanRepository = require('../repositories/BookLoanRepository');
const bookService = require('./BookService');
const userRepository = require('../repositories/UserRepository');
const config = require('../config/app');
const logger = require('../utils/logger');

// Loan service
class LoanService {
  // Borrow a book
  async borrowBook(bookId, userId, options = {}) {
    const {
      loan_period_days = config.business.defaultLoanPeriodDays,
      notes = null
    } = options;

    // Get user to check loan limits
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check user's current active loans
    const activeLoans = await bookLoanRepository.getActiveByUser(userId);
    if (activeLoans.length >= user.max_books_allowed) {
      throw new Error(`Maximum loan limit reached (${user.max_books_allowed} books)`);
    }

    // Check if user already has this book borrowed
    const existingLoan = await bookLoanRepository.findActiveUserBookLoan(userId, bookId);
    if (existingLoan) {
      throw new Error('You already have an active loan for this book');
    }

    // Check book availability and reserve a copy
    const book = await bookService.reserveCopy(bookId);

    try {
      // Calculate due date
      const loanDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loan_period_days);

      // Create the loan
      const loanData = {
        book_id: bookId,
        user_id: userId,
        loan_date: loanDate,
        due_date: dueDate,
        status: 'active',
        notes
      };

      const loan = await bookLoanRepository.create(loanData);

      logger.info('Book borrowed', {
        loanId: loan.id,
        bookId: bookId,
        userId: userId,
        dueDate: dueDate,
        activeLoans: activeLoans.length + 1
      });

      // Return loan with book details
      return await bookLoanRepository.findById(loan.id, true);
    } catch (error) {
      // If loan creation fails, release the reserved copy
      try {
        await bookService.releaseCopy(bookId);
      } catch (releaseError) {
        logger.error('Failed to release copy after loan creation failure', {
          bookId,
          error: releaseError.message
        });
      }
      throw error;
    }
  }

  /**
   * Return a book
   * @param {string} loanId - Loan ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} options - Return options
   * @returns {Promise<BookLoan>} Updated loan
   */
  async returnBook(loanId, userId, options = {}) {
    const {
      return_date = new Date(),
      notes = null,
      force = false // Allow librarians to force return
    } = options;

    // Get the loan
    const loan = await bookLoanRepository.findById(loanId, true);
    if (!loan) {
      throw new Error('Loan not found');
    }

    // Check authorization (user can return their own books, librarians can return any)
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!force && user.role !== 'librarian' && loan.user_id !== userId) {
      throw new Error('You can only return your own borrowed books');
    }

    // Check if book is already returned
    if (loan.isReturned()) {
      throw new Error('Book has already been returned');
    }

    // Return the book (update loan status)
    const returnedLoan = await bookLoanRepository.returnBook(loanId, return_date, notes);

    // Release the copy (increase available count)
    await bookService.releaseCopy(loan.book_id);

    logger.info('Book returned', {
      loanId: loanId,
      bookId: loan.book_id,
      userId: loan.user_id,
      returnedBy: userId,
      returnDate: return_date,
      wasOverdue: loan.isOverdue()
    });

    return await bookLoanRepository.findById(loanId, true);
  }

  /**
   * Get user's loan history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<{loans: BookLoan[], total: number, page: number, pages: number}>} Loan history
   */
  async getUserLoans(userId, options = {}) {
    const {
      status = null,
      page = 1,
      limit = config.pagination.defaultLimit
    } = options;

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(
      Math.max(1, parseInt(limit) || config.pagination.defaultLimit),
      config.pagination.maxLimit
    );
    const offset = (validatedPage - 1) * validatedLimit;

    const result = await bookLoanRepository.getUserLoans(userId, {
      status,
      limit: validatedLimit,
      offset
    });

    return {
      loans: result.loans,
      total: result.total,
      page: validatedPage,
      pages: Math.ceil(result.total / validatedLimit),
      limit: validatedLimit
    };
  }

  /**
   * Get all loans (librarian only)
   * @param {Object} options - Query options
   * @returns {Promise<{loans: BookLoan[], total: number, page: number, pages: number}>} All loans
   */
  async getAllLoans(options = {}) {
    const {
      status = null,
      user_id = null,
      book_id = null,
      overdue_only = false,
      page = 1,
      limit = config.pagination.defaultLimit,
      sort_by = 'loan_date',
      sort_order = 'DESC'
    } = options;

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(
      Math.max(1, parseInt(limit) || config.pagination.defaultLimit),
      config.pagination.maxLimit
    );
    const offset = (validatedPage - 1) * validatedLimit;

    const result = await bookLoanRepository.findAll({
      status,
      user_id,
      book_id,
      overdue_only: Boolean(overdue_only),
      limit: validatedLimit,
      offset,
      sort_by,
      sort_order
    });

    return {
      loans: result.loans,
      total: result.total,
      page: validatedPage,
      pages: Math.ceil(result.total / validatedLimit),
      limit: validatedLimit
    };
  }

  /**
   * Get overdue loans
   * @param {Object} options - Query options
   * @returns {Promise<BookLoan[]>} Overdue loans
   */
  async getOverdueLoans(options = {}) {
    const { limit = 50 } = options;
    return await bookLoanRepository.getOverdueLoans({ limit });
  }

  /**
   * Renew a loan (extend due date)
   * @param {string} loanId - Loan ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} options - Renewal options
   * @returns {Promise<BookLoan>} Updated loan
   */
  async renewLoan(loanId, userId, options = {}) {
    const {
      extension_days = config.business.defaultLoanPeriodDays,
      notes = null
    } = options;

    // Get the loan
    const loan = await bookLoanRepository.findById(loanId, true);
    if (!loan) {
      throw new Error('Loan not found');
    }

    // Check authorization
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'librarian' && loan.user_id !== userId) {
      throw new Error('You can only renew your own loans');
    }

    // Check if loan can be renewed
    if (!loan.canRenew()) {
      throw new Error('Loan cannot be renewed (already returned or overdue)');
    }

    // Calculate new due date
    const currentDueDate = new Date(loan.due_date);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + extension_days);

    // Update the loan
    const updates = {
      due_date: newDueDate
    };

    if (notes) {
      updates.notes = loan.notes ? `${loan.notes}; ${notes}` : notes;
    }

    const renewedLoan = await bookLoanRepository.update(loanId, updates);

    logger.info('Loan renewed', {
      loanId: loanId,
      bookId: loan.book_id,
      userId: loan.user_id,
      renewedBy: userId,
      oldDueDate: loan.due_date,
      newDueDate: newDueDate,
      extensionDays: extension_days
    });

    return await bookLoanRepository.findById(loanId, true);
  }

  /**
   * Get loan by ID
   * @param {string} loanId - Loan ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} userRole - User role
   * @returns {Promise<BookLoan|null>} Loan or null
   */
  async getLoanById(loanId, userId, userRole) {
    const loan = await bookLoanRepository.findById(loanId, true);
    
    if (!loan) {
      return null;
    }

    // Check authorization (users can only see their own loans, librarians can see all)
    if (userRole !== 'librarian' && loan.user_id !== userId) {
      throw new Error('Access denied');
    }

    return loan;
  }

  /**
   * Mark overdue loans and return count
   * @returns {Promise<number>} Number of loans marked as overdue
   */
  async updateOverdueLoans() {
    const count = await bookLoanRepository.markOverdueLoans();
    
    if (count > 0) {
      logger.info('Loans marked as overdue', { count });
    }

    return count;
  }

  /**
   * Get loan statistics
   * @returns {Promise<Object>} Loan statistics
   */
  async getStatistics() {
    return await bookLoanRepository.getStatistics();
  }

  /**
   * Get most borrowed books
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Most borrowed books
   */
  async getMostBorrowedBooks(options = {}) {
    const {
      limit = 10,
      period_days = 30
    } = options;

    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50);
    const validatedPeriod = Math.max(1, parseInt(period_days) || 30);

    return await bookLoanRepository.getMostBorrowedBooks({
      limit: validatedLimit,
      period_days: validatedPeriod
    });
  }

  /**
   * Get member loan summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Member loan summary
   */
  async getMemberLoanSummary(userId) {
    return await bookLoanRepository.getMemberLoanSummary(userId);
  }

  /**
   * Check if user can borrow more books
   * @param {string} userId - User ID
   * @returns {Promise<{canBorrow: boolean, activeLoans: number, maxAllowed: number, reason?: string}>} Borrowing eligibility
   */
  async checkBorrowingEligibility(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return {
        canBorrow: false,
        activeLoans: 0,
        maxAllowed: 0,
        reason: 'User not found'
      };
    }

    const activeLoans = await bookLoanRepository.getActiveByUser(userId);
    const canBorrow = activeLoans.length < user.max_books_allowed;

    const result = {
      canBorrow,
      activeLoans: activeLoans.length,
      maxAllowed: user.max_books_allowed
    };

    if (!canBorrow) {
      result.reason = `Maximum loan limit reached (${user.max_books_allowed} books)`;
    }

    return result;
  }

  /**
   * Force return a book (librarian only - for lost/damaged books)
   * @param {string} loanId - Loan ID
   * @param {string} librarianId - Librarian ID
   * @param {Object} options - Force return options
   * @returns {Promise<BookLoan>} Updated loan
   */
  async forceReturnBook(loanId, librarianId, options = {}) {
    const {
      return_date = new Date(),
      notes = 'Force returned by librarian'
    } = options;

    // Verify librarian authorization
    const librarian = await userRepository.findById(librarianId);
    if (!librarian || librarian.role !== 'librarian') {
      throw new Error('Only librarians can force return books');
    }

    return await this.returnBook(loanId, librarianId, {
      return_date,
      notes,
      force: true
    });
  }
}

module.exports = new LoanService();