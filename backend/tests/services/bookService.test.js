const BookService = require('../../src/services/BookService');
const BookRepository = require('../../src/repositories/BookRepository');
const BookLoanRepository = require('../../src/repositories/BookLoanRepository');
const CategoryRepository = require('../../src/repositories/CategoryRepository');

// Mock dependencies
jest.mock('../../src/repositories/BookRepository');
jest.mock('../../src/repositories/BookLoanRepository');
jest.mock('../../src/repositories/CategoryRepository');

describe('BookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a book with categories', async () => {
      const bookData = {
        isbn: '9781234567890',
        title: 'Test Book',
        author: 'Test Author',
        publisher: 'Test Publisher',
        publication_year: 2024,
        description: 'A test book',
        total_copies: 5,
        categoryIds: ['cat-1', 'cat-2']
      };

      const createdBook = {
        id: 'book-123',
        ...bookData,
        available_copies: 5
      };

      BookRepository.findByIsbn.mockResolvedValue(null);
      BookRepository.create.mockResolvedValue(createdBook);
      CategoryRepository.findByIds.mockResolvedValue([
        { id: 'cat-1', name: 'Fiction' },
        { id: 'cat-2', name: 'Adventure' }
      ]);
      BookRepository.addCategories.mockResolvedValue();

      const result = await BookService.create(bookData);

      expect(BookRepository.findByIsbn).toHaveBeenCalledWith(bookData.isbn);
      expect(BookRepository.create).toHaveBeenCalledWith({
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        publication_year: bookData.publication_year,
        description: bookData.description,
        total_copies: bookData.total_copies,
        available_copies: bookData.total_copies
      });
      expect(BookRepository.addCategories).toHaveBeenCalledWith('book-123', ['cat-1', 'cat-2']);
      expect(result).toEqual(createdBook);
    });

    it('should throw error if ISBN already exists', async () => {
      const bookData = {
        isbn: '9781234567890',
        title: 'Test Book'
      };

      BookRepository.findByIsbn.mockResolvedValue({ id: 'existing-book' });

      await expect(BookService.create(bookData))
        .rejects.toThrow('A book with this ISBN already exists');
    });

    it('should validate total copies', async () => {
      const bookData = {
        isbn: '9781234567890',
        title: 'Test Book',
        total_copies: 0
      };

      BookRepository.findByIsbn.mockResolvedValue(null);

      await expect(BookService.create(bookData))
        .rejects.toThrow('Total copies must be at least 1');
    });
  });

  describe('update', () => {
    const bookId = 'book-123';

    it('should update book successfully', async () => {
      const existingBook = {
        id: bookId,
        isbn: '9781234567890',
        title: 'Old Title',
        total_copies: 5,
        available_copies: 3
      };

      const updateData = {
        title: 'New Title',
        total_copies: 8
      };

      const updatedBook = {
        ...existingBook,
        ...updateData,
        available_copies: 6 // 3 + (8 - 5)
      };

      BookRepository.findById.mockResolvedValue(existingBook);
      BookRepository.update.mockResolvedValue(updatedBook);

      const result = await BookService.update(bookId, updateData);

      expect(BookRepository.findById).toHaveBeenCalledWith(bookId);
      expect(BookRepository.update).toHaveBeenCalledWith(bookId, {
        title: 'New Title',
        total_copies: 8,
        available_copies: 6
      });
      expect(result).toEqual(updatedBook);
    });

    it('should throw error when book not found', async () => {
      BookRepository.findById.mockResolvedValue(null);

      await expect(BookService.update(bookId, { title: 'New Title' }))
        .rejects.toThrow('Book not found');
    });

    it('should prevent reducing total copies below loaned amount', async () => {
      const existingBook = {
        id: bookId,
        total_copies: 5,
        available_copies: 2 // 3 books are loaned out
      };

      const updateData = {
        total_copies: 2 // Trying to reduce to less than loaned amount
      };

      BookRepository.findById.mockResolvedValue(existingBook);

      await expect(BookService.update(bookId, updateData))
        .rejects.toThrow('Cannot reduce total copies below the number of currently loaned books');
    });
  });

  describe('delete', () => {
    const bookId = 'book-123';

    it('should delete book successfully when no active loans', async () => {
      const book = { id: bookId, title: 'Test Book' };

      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.hasActiveLoansForBook.mockResolvedValue(false);
      BookRepository.delete.mockResolvedValue();

      await BookService.delete(bookId);

      expect(BookRepository.findById).toHaveBeenCalledWith(bookId);
      expect(BookLoanRepository.hasActiveLoansForBook).toHaveBeenCalledWith(bookId);
      expect(BookRepository.delete).toHaveBeenCalledWith(bookId);
    });

    it('should throw error when book has active loans', async () => {
      const book = { id: bookId, title: 'Test Book' };

      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.hasActiveLoansForBook.mockResolvedValue(true);

      await expect(BookService.delete(bookId))
        .rejects.toThrow('Cannot delete book with active loans');

      expect(BookRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search books with filters', async () => {
      const filters = {
        search: 'JavaScript',
        author: 'Douglas',
        availability: 'available',
        page: 1,
        limit: 20
      };

      const searchResult = {
        data: [
          { id: 'book-1', title: 'JavaScript: The Good Parts' },
          { id: 'book-2', title: 'JavaScript Patterns' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      BookRepository.search.mockResolvedValue(searchResult);

      const result = await BookService.search(filters);

      expect(BookRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(searchResult);
    });

    it('should get popular books', async () => {
      const popularBooks = [
        { id: 'book-1', title: 'Popular Book 1', borrow_count: 50 },
        { id: 'book-2', title: 'Popular Book 2', borrow_count: 45 }
      ];

      BookRepository.getPopular.mockResolvedValue(popularBooks);

      const result = await BookService.getPopularBooks(10);

      expect(BookRepository.getPopular).toHaveBeenCalledWith(10);
      expect(result).toEqual(popularBooks);
    });
  });

  describe('checkAvailability', () => {
    it('should return availability information', async () => {
      const bookId = 'book-123';
      const book = {
        id: bookId,
        title: 'Test Book',
        total_copies: 5,
        available_copies: 2
      };

      BookRepository.findById.mockResolvedValue(book);

      const result = await BookService.checkAvailability(bookId);

      expect(result).toEqual({
        bookId,
        title: 'Test Book',
        totalCopies: 5,
        availableCopies: 2,
        loanedCopies: 3,
        isAvailable: true
      });
    });

    it('should indicate when book is not available', async () => {
      const bookId = 'book-123';
      const book = {
        id: bookId,
        title: 'Test Book',
        total_copies: 3,
        available_copies: 0
      };

      BookRepository.findById.mockResolvedValue(book);

      const result = await BookService.checkAvailability(bookId);

      expect(result.isAvailable).toBe(false);
      expect(result.loanedCopies).toBe(3);
    });
  });
});