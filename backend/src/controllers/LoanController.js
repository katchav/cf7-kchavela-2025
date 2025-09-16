const { validationResult } = require('express-validator');
const loanService = require('../services/LoanService');
const logger = require('../utils/logger');

// Loan controller
class LoanController {
  // Borrow a book
  async borrowBook(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { book_id, loan_period_days, notes } = req.body;
      const userId = req.user.id;

      const loan = await loanService.borrowBook(book_id, userId, {
        loan_period_days,
        notes
      });

      logger.info('Book borrowed via API', {
        loanId: loan.id,
        bookId: book_id,
        userId: userId
      });

      res.status(201).json({
        message: 'Book borrowed',
        data: loan.toJSON(true, false)
      });
    } catch (error) {
      if (error.message.includes('Maximum loan limit')) {
        return res.status(400).json({
          error: error.message,
          code: 'LOAN_LIMIT_EXCEEDED'
        });
      }

      if (error.message.includes('already have an active loan')) {
        return res.status(400).json({
          error: error.message,
          code: 'BOOK_ALREADY_BORROWED'
        });
      }

      if (error.message.includes('not available') || error.message.includes('No copies available')) {
        return res.status(400).json({
          error: 'Book is not available for borrowing',
          code: 'BOOK_NOT_AVAILABLE'
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: error.message,
          code: 'USER_NOT_FOUND'
        });
      }

      logger.error('Borrow book error:', error);
      next(error);
    }
  }

  /**
   * Return a book
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async returnBook(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id: loanId } = req.params;
      const { return_date, notes } = req.body;
      const userId = req.user.id;

      const loan = await loanService.returnBook(loanId, userId, {
        return_date: return_date ? new Date(return_date) : undefined,
        notes,
        force: req.user.role === 'librarian'
      });

      logger.info('Book returned via API', {
        loanId: loanId,
        userId: userId,
        returnedBy: req.user.id
      });

      res.json({
        message: 'Book returned successfully',
        data: loan.toJSON(true, false)
      });
    } catch (error) {
      if (error.message === 'Loan not found') {
        return res.status(404).json({
          error: error.message,
          code: 'LOAN_NOT_FOUND'
        });
      }

      if (error.message.includes('only return your own')) {
        return res.status(403).json({
          error: error.message,
          code: 'ACCESS_DENIED'
        });
      }

      if (error.message.includes('already been returned')) {
        return res.status(400).json({
          error: error.message,
          code: 'BOOK_ALREADY_RETURNED'
        });
      }

      logger.error('Return book error:', error);
      next(error);
    }
  }

  /**
   * Get user's loan history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getMyLoans(req, res, next) {
    try {
      const options = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await loanService.getUserLoans(req.user.id, options);

      res.json({
        message: 'User loans retrieved successfully',
        data: result.loans.map(loan => loan.toJSON()),
        pagination: {
          page: result.page,
          pages: result.pages,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      logger.error('Get user loans error:', error);
      next(error);
    }
  }

  /**
   * Get all loans (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getAllLoans(req, res, next) {
    try {
      const options = {
        status: req.query.status,
        user_id: req.query.user_id,
        book_id: req.query.book_id,
        overdue_only: req.query.overdue_only,
        page: req.query.page,
        limit: req.query.limit,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const result = await loanService.getAllLoans(options);

      res.json({
        message: 'All loans retrieved successfully',
        data: result.loans.map(loan => loan.toJSON(true, true)),
        pagination: {
          page: result.page,
          pages: result.pages,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      logger.error('Get all loans error:', error);
      next(error);
    }
  }

  /**
   * Get a specific loan by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getLoanById(req, res, next) {
    try {
      const { id } = req.params;

      const loan = await loanService.getLoanById(id, req.user.id, req.user.role);

      if (!loan) {
        return res.status(404).json({
          error: 'Loan not found',
          code: 'LOAN_NOT_FOUND'
        });
      }

      res.json({
        message: 'Loan retrieved successfully',
        data: loan.toJSON(true, req.user.role === 'librarian')
      });
    } catch (error) {
      if (error.message === 'Access denied') {
        return res.status(403).json({
          error: error.message,
          code: 'ACCESS_DENIED'
        });
      }

      logger.error('Get loan by ID error:', error);
      next(error);
    }
  }

  /**
   * Renew a loan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async renewLoan(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id: loanId } = req.params;
      const { extension_days, notes } = req.body;
      const userId = req.user.id;

      const loan = await loanService.renewLoan(loanId, userId, {
        extension_days,
        notes
      });

      logger.info('Loan renewed via API', {
        loanId: loanId,
        userId: userId,
        renewedBy: req.user.id,
        extensionDays: extension_days
      });

      res.json({
        message: 'Loan renewed successfully',
        data: loan.toJSON(true, false)
      });
    } catch (error) {
      if (error.message === 'Loan not found') {
        return res.status(404).json({
          error: error.message,
          code: 'LOAN_NOT_FOUND'
        });
      }

      if (error.message.includes('only renew your own')) {
        return res.status(403).json({
          error: error.message,
          code: 'ACCESS_DENIED'
        });
      }

      if (error.message.includes('cannot be renewed')) {
        return res.status(400).json({
          error: error.message,
          code: 'CANNOT_RENEW'
        });
      }

      logger.error('Renew loan error:', error);
      next(error);
    }
  }

  /**
   * Get overdue loans (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getOverdueLoans(req, res, next) {
    try {
      const options = {
        limit: req.query.limit
      };

      const loans = await loanService.getOverdueLoans(options);

      res.json({
        message: 'Overdue loans retrieved successfully',
        data: loans.map(loan => loan.toOverdueReport())
      });
    } catch (error) {
      logger.error('Get overdue loans error:', error);
      next(error);
    }
  }

  /**
   * Force return a book (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async forceReturnBook(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id: loanId } = req.params;
      const { return_date, notes } = req.body;

      const loan = await loanService.forceReturnBook(loanId, req.user.id, {
        return_date: return_date ? new Date(return_date) : undefined,
        notes
      });

      logger.info('Book force returned via API', {
        loanId: loanId,
        librarianId: req.user.id
      });

      res.json({
        message: 'Book force returned successfully',
        data: loan.toJSON(true, true)
      });
    } catch (error) {
      if (error.message.includes('Only librarians')) {
        return res.status(403).json({
          error: error.message,
          code: 'LIBRARIAN_REQUIRED'
        });
      }

      logger.error('Force return book error:', error);
      next(error);
    }
  }

  /**
   * Check borrowing eligibility for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async checkBorrowingEligibility(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;

      // Check authorization
      if (req.user.role !== 'librarian' && userId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const eligibility = await loanService.checkBorrowingEligibility(userId);

      res.json({
        message: 'Borrowing eligibility checked successfully',
        data: eligibility
      });
    } catch (error) {
      logger.error('Check borrowing eligibility error:', error);
      next(error);
    }
  }

  /**
   * Get loan statistics (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await loanService.getStatistics();

      res.json({
        message: 'Loan statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Get loan statistics error:', error);
      next(error);
    }
  }

  /**
   * Get most borrowed books (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getMostBorrowedBooks(req, res, next) {
    try {
      const options = {
        limit: req.query.limit,
        period_days: req.query.period_days
      };

      const books = await loanService.getMostBorrowedBooks(options);

      res.json({
        message: 'Most borrowed books retrieved successfully',
        data: books
      });
    } catch (error) {
      logger.error('Get most borrowed books error:', error);
      next(error);
    }
  }

  /**
   * Get member loan summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getMemberLoanSummary(req, res, next) {
    try {
      const userId = req.params.userId || req.user.id;

      // Check authorization
      if (req.user.role !== 'librarian' && userId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const summary = await loanService.getMemberLoanSummary(userId);

      res.json({
        message: 'Member loan summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      logger.error('Get member loan summary error:', error);
      next(error);
    }
  }

  /**
   * Update overdue loans status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateOverdueLoans(req, res, next) {
    try {
      const count = await loanService.updateOverdueLoans();

      res.json({
        message: 'Overdue loans updated successfully',
        data: {
          updated_count: count
        }
      });
    } catch (error) {
      logger.error('Update overdue loans error:', error);
      next(error);
    }
  }
}

module.exports = new LoanController();