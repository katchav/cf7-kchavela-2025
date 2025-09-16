const LoanService = require('../../src/services/LoanService');
const BookLoanRepository = require('../../src/repositories/BookLoanRepository');
const BookRepository = require('../../src/repositories/BookRepository');
const UserRepository = require('../../src/repositories/UserRepository');

// Mock dependencies
jest.mock('../../src/repositories/BookLoanRepository');
jest.mock('../../src/repositories/BookRepository');
jest.mock('../../src/repositories/UserRepository');

describe('LoanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('borrowBook', () => {
    const userId = 'user-123';
    const bookId = 'book-456';

    it('should borrow a book successfully', async () => {
      const user = { id: userId, max_books_allowed: 10 };
      const book = { id: bookId, available_copies: 3 };
      const activeLoans = [{ id: 'loan-1' }, { id: 'loan-2' }];
      const newLoan = {
        id: 'loan-789',
        book_id: bookId,
        user_id: userId,
        status: 'active'
      };

      UserRepository.findById.mockResolvedValue(user);
      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.getActiveByUser.mockResolvedValue(activeLoans);
      BookLoanRepository.hasActiveLoan.mockResolvedValue(false);
      BookLoanRepository.create.mockResolvedValue(newLoan);
      BookRepository.updateAvailableCopies.mockResolvedValue();

      const result = await LoanService.borrowBook(bookId, userId);

      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(BookRepository.findById).toHaveBeenCalledWith(bookId);
      expect(BookLoanRepository.getActiveByUser).toHaveBeenCalledWith(userId);
      expect(BookLoanRepository.hasActiveLoan).toHaveBeenCalledWith(userId, bookId);
      expect(BookRepository.updateAvailableCopies).toHaveBeenCalledWith(bookId, 2);
      expect(result).toEqual(newLoan);
    });

    it('should throw error when user not found', async () => {
      UserRepository.findById.mockResolvedValue(null);

      await expect(LoanService.borrowBook(bookId, userId))
        .rejects.toThrow('User not found');
    });

    it('should throw error when book not found', async () => {
      const user = { id: userId, max_books_allowed: 10 };
      
      UserRepository.findById.mockResolvedValue(user);
      BookRepository.findById.mockResolvedValue(null);

      await expect(LoanService.borrowBook(bookId, userId))
        .rejects.toThrow('Book not found');
    });

    it('should throw error when user has reached borrowing limit', async () => {
      const user = { id: userId, max_books_allowed: 2 };
      const book = { id: bookId, available_copies: 3 };
      const activeLoans = [{ id: 'loan-1' }, { id: 'loan-2' }];

      UserRepository.findById.mockResolvedValue(user);
      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.getActiveByUser.mockResolvedValue(activeLoans);

      await expect(LoanService.borrowBook(bookId, userId))
        .rejects.toThrow('You have reached your borrowing limit of 2 books');
    });

    it('should throw error when book is not available', async () => {
      const user = { id: userId, max_books_allowed: 10 };
      const book = { id: bookId, available_copies: 0 };
      const activeLoans = [];

      UserRepository.findById.mockResolvedValue(user);
      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.getActiveByUser.mockResolvedValue(activeLoans);

      await expect(LoanService.borrowBook(bookId, userId))
        .rejects.toThrow('Book is not available for borrowing');
    });

    it('should throw error when user already has active loan for the book', async () => {
      const user = { id: userId, max_books_allowed: 10 };
      const book = { id: bookId, available_copies: 3 };
      const activeLoans = [{ id: 'loan-1' }];

      UserRepository.findById.mockResolvedValue(user);
      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.getActiveByUser.mockResolvedValue(activeLoans);
      BookLoanRepository.hasActiveLoan.mockResolvedValue(true);

      await expect(LoanService.borrowBook(bookId, userId))
        .rejects.toThrow('You already have an active loan for this book');
    });
  });

  describe('returnBook', () => {
    const loanId = 'loan-123';
    const userId = 'user-456';

    it('should return a book successfully', async () => {
      const loan = {
        id: loanId,
        book_id: 'book-789',
        user_id: userId,
        status: 'active'
      };
      const book = { id: 'book-789', available_copies: 2 };

      BookLoanRepository.findById.mockResolvedValue(loan);
      BookRepository.findById.mockResolvedValue(book);
      BookLoanRepository.update.mockResolvedValue({ ...loan, status: 'returned' });
      BookRepository.updateAvailableCopies.mockResolvedValue();

      const result = await LoanService.returnBook(loanId, userId);

      expect(BookLoanRepository.findById).toHaveBeenCalledWith(loanId);
      expect(BookLoanRepository.update).toHaveBeenCalledWith(loanId, {
        return_date: expect.any(Date),
        status: 'returned'
      });
      expect(BookRepository.updateAvailableCopies).toHaveBeenCalledWith('book-789', 3);
      expect(result.status).toBe('returned');
    });

    it('should throw error when loan not found', async () => {
      BookLoanRepository.findById.mockResolvedValue(null);

      await expect(LoanService.returnBook(loanId, userId))
        .rejects.toThrow('Loan not found');
    });

    it('should throw error when user does not own the loan', async () => {
      const loan = {
        id: loanId,
        user_id: 'different-user',
        status: 'active'
      };

      BookLoanRepository.findById.mockResolvedValue(loan);

      await expect(LoanService.returnBook(loanId, userId))
        .rejects.toThrow('You do not have permission to return this loan');
    });

    it('should throw error when book is already returned', async () => {
      const loan = {
        id: loanId,
        user_id: userId,
        status: 'returned'
      };

      BookLoanRepository.findById.mockResolvedValue(loan);

      await expect(LoanService.returnBook(loanId, userId))
        .rejects.toThrow('This book has already been returned');
    });
  });

  describe('updateOverdueLoans', () => {
    it('should mark overdue loans correctly', async () => {
      const overdueLoans = [
        { id: 'loan-1', due_date: new Date('2024-01-01') },
        { id: 'loan-2', due_date: new Date('2024-01-02') }
      ];

      BookLoanRepository.getOverdueLoans.mockResolvedValue(overdueLoans);
      BookLoanRepository.markAsOverdue.mockResolvedValue();

      const result = await LoanService.updateOverdueLoans();

      expect(BookLoanRepository.getOverdueLoans).toHaveBeenCalled();
      expect(BookLoanRepository.markAsOverdue).toHaveBeenCalledWith(['loan-1', 'loan-2']);
      expect(result).toEqual({ updated: 2 });
    });

    it('should handle no overdue loans', async () => {
      BookLoanRepository.getOverdueLoans.mockResolvedValue([]);

      const result = await LoanService.updateOverdueLoans();

      expect(BookLoanRepository.markAsOverdue).not.toHaveBeenCalled();
      expect(result).toEqual({ updated: 0 });
    });
  });

  describe('checkEligibility', () => {
    it('should return eligibility status for user', async () => {
      const userId = 'user-123';
      const user = { id: userId, max_books_allowed: 10 };
      const activeLoans = [
        { id: 'loan-1', status: 'active' },
        { id: 'loan-2', status: 'active' },
        { id: 'loan-3', status: 'overdue' }
      ];

      UserRepository.findById.mockResolvedValue(user);
      BookLoanRepository.getActiveByUser.mockResolvedValue(activeLoans);

      const result = await LoanService.checkEligibility(userId);

      expect(result).toEqual({
        canBorrow: true,
        activeLoans: 3,
        maxAllowed: 10,
        availableSlots: 7,
        overdueLoans: 1
      });
    });

    it('should indicate when user cannot borrow', async () => {
      const userId = 'user-123';
      const user = { id: userId, max_books_allowed: 3 };
      const activeLoans = [
        { id: 'loan-1', status: 'active' },
        { id: 'loan-2', status: 'active' },
        { id: 'loan-3', status: 'active' }
      ];

      UserRepository.findById.mockResolvedValue(user);
      BookLoanRepository.getActiveByUser.mockResolvedValue(activeLoans);

      const result = await LoanService.checkEligibility(userId);

      expect(result.canBorrow).toBe(false);
      expect(result.availableSlots).toBe(0);
    });
  });
});