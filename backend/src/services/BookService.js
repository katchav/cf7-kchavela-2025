const bookRepository = require('../repositories/BookRepository');
const config = require('../config/app');
const logger = require('../utils/logger');

// Book service
class BookService {
  // Create a new book
  async createBook(bookData, categoryIds = []) {
    // Validate ISBN uniqueness
    const existingBook = await bookRepository.findByIsbn(bookData.isbn);
    if (existingBook) {
      throw new Error('A book with this ISBN already exists');
    }

    // Validate copy counts
    if (bookData.total_copies < 1) {
      throw new Error('Total copies must be at least 1');
    }

    if (bookData.available_copies !== undefined) {
      if (bookData.available_copies < 0 || bookData.available_copies > bookData.total_copies) {
        throw new Error('Available copies must be between 0 and total copies');
      }
    }

    // Create the book
    const book = await bookRepository.create(bookData);

    // Add categories if provided
    if (categoryIds.length > 0) {
      await bookRepository.addCategories(book.id, categoryIds);
      // Fetch the book again with categories
      return await bookRepository.findById(book.id, true);
    }

    logger.info('Book created', {
      bookId: book.id,
      isbn: book.isbn,
      title: book.title
    });

    return book;
  }

  // Update book details
  async updateBook(bookId, updates, categoryIds = null) {
    // Check if book exists
    const existingBook = await bookRepository.findById(bookId);
    if (!existingBook) {
      throw new Error('Book not found');
    }

    // Validate ISBN uniqueness if ISBN is being updated
    if (updates.isbn && updates.isbn !== existingBook.isbn) {
      const duplicateBook = await bookRepository.findByIsbn(updates.isbn);
      if (duplicateBook) {
        throw new Error('A book with this ISBN already exists');
      }
    }

    // Validate copy counts if being updated
    if (updates.total_copies !== undefined) {
      if (updates.total_copies < 1) {
        throw new Error('Total copies must be at least 1');
      }
      
      // Ensure available copies don't exceed new total
      const currentBorrowed = existingBook.total_copies - existingBook.available_copies;
      if (updates.total_copies < currentBorrowed) {
        throw new Error(`Cannot reduce total copies below currently borrowed copies (${currentBorrowed})`);
      }
      
      // Adjust available copies if total is being reduced
      if (updates.total_copies < existingBook.total_copies) {
        const maxAvailable = updates.total_copies - currentBorrowed;
        updates.available_copies = Math.min(existingBook.available_copies, maxAvailable);
      }
    }

    if (updates.available_copies !== undefined) {
      const totalCopies = updates.total_copies || existingBook.total_copies;
      if (updates.available_copies < 0 || updates.available_copies > totalCopies) {
        throw new Error('Available copies must be between 0 and total copies');
      }
    }

    // Update the book
    const updatedBook = await bookRepository.update(bookId, updates);

    // Update categories if provided
    if (categoryIds !== null) {
      await bookRepository.addCategories(bookId, categoryIds);
    }

    logger.info('Book updated', {
      bookId: bookId,
      updates: Object.keys(updates)
    });

    // Return book with categories if they were updated
    return await bookRepository.findById(bookId, categoryIds !== null);
  }

  // Delete a book
  async deleteBook(bookId) {
    // Check if book exists
    const book = await bookRepository.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // Check if book has active loans
    const activeBorrowedCopies = book.total_copies - book.available_copies;
    if (activeBorrowedCopies > 0) {
      throw new Error('Cannot delete book with active loans');
    }

    const deleted = await bookRepository.delete(bookId);
    
    if (deleted) {
      logger.info('Book deleted', {
        bookId: bookId,
        title: book.title
      });
    }

    return deleted;
  }

  // Get book by ID
  async getBookById(bookId, includeCategories = true) {
    return await bookRepository.findById(bookId, includeCategories);
  }

  /**
   * Search books with business logic validation
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<{books: Book[], total: number, page: number, pages: number}>} Search results
   */
  async searchBooks(searchParams) {
    // Validate and sanitize parameters
    const {
      search,
      author,
      publisher,
      category,
      year_from,
      year_to,
      available_only = false,
      page = 1,
      limit = config.pagination.defaultLimit,
      sort_by = 'title',
      sort_order = 'ASC'
    } = searchParams;

    // Validate pagination
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(
      Math.max(1, parseInt(limit) || config.pagination.defaultLimit),
      config.pagination.maxLimit
    );
    const offset = (validatedPage - 1) * validatedLimit;

    // Validate year range
    if (year_from && year_to && parseInt(year_from) > parseInt(year_to)) {
      throw new Error('Year from cannot be greater than year to');
    }

    const searchOptions = {
      search,
      author,
      publisher,
      category,
      year_from: year_from ? parseInt(year_from) : null,
      year_to: year_to ? parseInt(year_to) : null,
      available_only: Boolean(available_only),
      limit: validatedLimit,
      offset,
      sort_by,
      sort_order
    };

    const result = await bookRepository.searchBooks(searchOptions);
    
    return {
      books: result.books,
      total: result.total,
      page: validatedPage,
      pages: Math.ceil(result.total / validatedLimit),
      limit: validatedLimit
    };
  }

  /**
   * Get books by category
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<{books: Book[], total: number}>} Books in category
   */
  async getBooksByCategory(categoryId, options = {}) {
    const {
      page = 1,
      limit = config.pagination.defaultLimit,
      available_only = false
    } = options;

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(
      Math.max(1, parseInt(limit) || config.pagination.defaultLimit),
      config.pagination.maxLimit
    );
    const offset = (validatedPage - 1) * validatedLimit;

    const result = await bookRepository.findByCategory(categoryId, {
      limit: validatedLimit,
      offset,
      available_only: Boolean(available_only)
    });

    return {
      books: result.books,
      total: result.total,
      page: validatedPage,
      pages: Math.ceil(result.total / validatedLimit),
      limit: validatedLimit
    };
  }

  /**
   * Get popular books
   * @param {Object} options - Query options
   * @returns {Promise<Book[]>} Popular books
   */
  async getPopularBooks(options = {}) {
    const {
      limit = 10,
      period_days = 30
    } = options;

    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50);
    const validatedPeriod = Math.max(1, parseInt(period_days) || 30);

    return await bookRepository.getMostPopular({
      limit: validatedLimit,
      period_days: validatedPeriod
    });
  }

  /**
   * Get recently added books
   * @param {Object} options - Query options
   * @returns {Promise<Book[]>} Recent books
   */
  async getRecentBooks(options = {}) {
    const {
      limit = 10,
      available_only = false
    } = options;

    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50);

    return await bookRepository.getRecentlyAdded({
      limit: validatedLimit,
      available_only: Boolean(available_only)
    });
  }

  /**
   * Check book availability for borrowing
   * @param {string} bookId - Book ID
   * @returns {Promise<{available: boolean, book: Book|null, reason?: string}>} Availability info
   */
  async checkAvailability(bookId) {
    const book = await bookRepository.findById(bookId);
    
    if (!book) {
      return {
        available: false,
        book: null,
        reason: 'Book not found'
      };
    }

    if (book.available_copies <= 0) {
      return {
        available: false,
        book,
        reason: 'No copies available'
      };
    }

    return {
      available: true,
      book
    };
  }

  /**
   * Reserve a copy for borrowing (decrease available count)
   * @param {string} bookId - Book ID
   * @returns {Promise<Book|null>} Updated book or null if not available
   */
  async reserveCopy(bookId) {
    const availability = await this.checkAvailability(bookId);
    
    if (!availability.available) {
      throw new Error(availability.reason);
    }

    const updatedBook = await bookRepository.updateAvailableCopies(bookId, -1);
    
    if (!updatedBook) {
      throw new Error('Failed to reserve copy - book may have become unavailable');
    }

    logger.info('Book copy reserved', {
      bookId: bookId,
      remainingCopies: updatedBook.available_copies
    });

    return updatedBook;
  }

  /**
   * Release a reserved copy (increase available count)
   * @param {string} bookId - Book ID
   * @returns {Promise<Book|null>} Updated book or null
   */
  async releaseCopy(bookId) {
    const book = await bookRepository.findById(bookId);
    
    if (!book) {
      throw new Error('Book not found');
    }

    if (book.available_copies >= book.total_copies) {
      throw new Error('All copies are already available');
    }

    const updatedBook = await bookRepository.updateAvailableCopies(bookId, 1);
    
    if (!updatedBook) {
      throw new Error('Failed to release copy');
    }

    logger.info('Book copy released', {
      bookId: bookId,
      availableCopies: updatedBook.available_copies
    });

    return updatedBook;
  }

  /**
   * Get book statistics
   * @returns {Promise<Object>} Book statistics
   */
  async getStatistics() {
    return await bookRepository.getStatistics();
  }
}

module.exports = new BookService();