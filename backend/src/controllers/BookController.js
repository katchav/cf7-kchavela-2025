const { validationResult } = require('express-validator');
const bookService = require('../services/BookService');
const logger = require('../utils/logger');

// Book controller
class BookController {
  // Get all books with filters
  async getBooks(req, res, next) {
    try {
      const searchParams = {
        search: req.query.search,
        author: req.query.author,
        publisher: req.query.publisher,
        category: req.query.category,
        year_from: req.query.year_from,
        year_to: req.query.year_to,
        available_only: req.query.available_only,
        page: req.query.page,
        limit: req.query.limit,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      const result = await bookService.searchBooks(searchParams);

      res.json({
        message: 'Books found',
        data: result.books.map(book => book.toSearchResult()),
        pagination: {
          page: result.page,
          pages: result.pages,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      if (error.message.includes('Year from cannot be greater')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_YEAR_RANGE'
        });
      }

      logger.error('Get books error:', error);
      next(error);
    }
  }

  /**
   * Get a specific book by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getBookById(req, res, next) {
    try {
      const { id } = req.params;
      const includeStats = req.query.include_stats === 'true';

      const book = await bookService.getBookById(id, true);

      if (!book) {
        return res.status(404).json({
          error: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        });
      }

      res.json({
        message: 'Book retrieved successfully',
        data: book.toJSON(includeStats)
      });
    } catch (error) {
      logger.error('Get book by ID error:', error);
      next(error);
    }
  }

  /**
   * Create a new book (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async createBook(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const bookData = {
        isbn: req.body.isbn,
        title: req.body.title,
        author: req.body.author,
        publisher: req.body.publisher,
        publication_year: req.body.publication_year,
        description: req.body.description,
        cover_image_url: req.body.cover_image_url,
        total_copies: req.body.total_copies || 1,
        available_copies: req.body.available_copies
      };

      const categoryIds = req.body.category_ids || [];

      const book = await bookService.createBook(bookData, categoryIds);

      logger.info('Book created via API', {
        bookId: book.id,
        createdBy: req.user.id,
        title: book.title
      });

      res.status(201).json({
        message: 'Book created successfully',
        data: book.toJSON(true)
      });
    } catch (error) {
      if (error.message === 'A book with this ISBN already exists') {
        return res.status(409).json({
          error: error.message,
          code: 'ISBN_EXISTS'
        });
      }

      if (error.message.includes('copies must be')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_COPIES'
        });
      }

      logger.error('Create book error:', error);
      next(error);
    }
  }

  /**
   * Update a book (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateBook(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updates = {};
      const categoryIds = req.body.category_ids;

      // Only include provided fields in updates
      const allowedFields = [
        'isbn', 'title', 'author', 'publisher', 'publication_year',
        'description', 'cover_image_url', 'total_copies', 'available_copies'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const book = await bookService.updateBook(id, updates, categoryIds);

      if (!book) {
        return res.status(404).json({
          error: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        });
      }

      logger.info('Book updated via API', {
        bookId: id,
        updatedBy: req.user.id,
        fields: Object.keys(updates)
      });

      res.json({
        message: 'Book updated successfully',
        data: book.toJSON(true)
      });
    } catch (error) {
      if (error.message === 'Book not found') {
        return res.status(404).json({
          error: error.message,
          code: 'BOOK_NOT_FOUND'
        });
      }

      if (error.message === 'A book with this ISBN already exists') {
        return res.status(409).json({
          error: error.message,
          code: 'ISBN_EXISTS'
        });
      }

      if (error.message.includes('copies') || error.message.includes('borrowed')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_COPIES'
        });
      }

      logger.error('Update book error:', error);
      next(error);
    }
  }

  /**
   * Delete a book (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async deleteBook(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = await bookService.deleteBook(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        });
      }

      logger.info('Book deleted via API', {
        bookId: id,
        deletedBy: req.user.id
      });

      res.json({
        message: 'Book deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Book not found') {
        return res.status(404).json({
          error: error.message,
          code: 'BOOK_NOT_FOUND'
        });
      }

      if (error.message === 'Cannot delete book with active loans') {
        return res.status(400).json({
          error: error.message,
          code: 'BOOK_HAS_ACTIVE_LOANS'
        });
      }

      logger.error('Delete book error:', error);
      next(error);
    }
  }

  /**
   * Get books by category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getBooksByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        available_only: req.query.available_only
      };

      const result = await bookService.getBooksByCategory(categoryId, options);

      res.json({
        message: 'Books by category retrieved successfully',
        data: result.books.map(book => book.toSummary()),
        pagination: {
          page: result.page,
          pages: result.pages,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      logger.error('Get books by category error:', error);
      next(error);
    }
  }

  /**
   * Get popular books
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getPopularBooks(req, res, next) {
    try {
      const options = {
        limit: req.query.limit,
        period_days: req.query.period_days
      };

      const books = await bookService.getPopularBooks(options);

      res.json({
        message: 'Popular books retrieved successfully',
        data: books.map(book => book.toSummary())
      });
    } catch (error) {
      logger.error('Get popular books error:', error);
      next(error);
    }
  }

  /**
   * Get recently added books
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getRecentBooks(req, res, next) {
    try {
      const options = {
        limit: req.query.limit,
        available_only: req.query.available_only
      };

      const books = await bookService.getRecentBooks(options);

      res.json({
        message: 'Recent books retrieved successfully',
        data: books.map(book => book.toSummary())
      });
    } catch (error) {
      logger.error('Get recent books error:', error);
      next(error);
    }
  }

  /**
   * Check book availability
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async checkAvailability(req, res, next) {
    try {
      const { id } = req.params;

      const availability = await bookService.checkAvailability(id);

      if (!availability.book) {
        return res.status(404).json({
          error: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        });
      }

      res.json({
        message: 'Availability checked successfully',
        data: {
          available: availability.available,
          book: availability.book.toSummary(),
          reason: availability.reason
        }
      });
    } catch (error) {
      logger.error('Check book availability error:', error);
      next(error);
    }
  }

  /**
   * Get book statistics (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await bookService.getStatistics();

      res.json({
        message: 'Book statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Get book statistics error:', error);
      next(error);
    }
  }
}

module.exports = new BookController();