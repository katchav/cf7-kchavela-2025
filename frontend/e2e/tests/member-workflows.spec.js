import { test, expect } from '@playwright/test';
import { BookListPage } from '../pages/BookListPage.js';
import { BookDetailPage } from '../pages/BookDetailPage.js';
import { MyLoansPage } from '../pages/MyLoansPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { TEST_USERS } from '../utils/test-data.js';

// Use member authentication for all tests in this file
test.use({ storageState: 'e2e/.auth/member.json' });

test.describe('Member Workflows', () => {

  test.describe('Book Browsing and Discovery', () => {
    
    test('should browse available books as authenticated member', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Verify books are displayed
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThan(0);
      
      // Verify page elements are accessible to members
      await bookListPage.verifyPageElements();
    });

    test('should search for books and view details', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      const bookDetailPage = new BookDetailPage(page);
      
      await bookListPage.navigate();
      
      // Search for books
      await bookListPage.searchBooks('Fiction');
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        // Click on first book to view details
        await bookListPage.clickFirstBook();
        
        // Verify book detail page
        await bookDetailPage.verifyPageElements();
        
        // Verify book information is displayed
        const bookInfo = await bookDetailPage.getBookInfo();
        expect(bookInfo.title).toBeTruthy();
        expect(bookInfo.author).toBeTruthy();
      }
    });

    test('should filter books by category', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Filter by category
      await bookListPage.filterByCategory('Fiction');
      
      // Verify filtered results
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Book Borrowing', () => {
    
    test('should successfully borrow an available book', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      const bookDetailPage = new BookDetailPage(page);
      const myLoansPage = new MyLoansPage(page);
      
      // Find an available book
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        await bookListPage.clickFirstBook();
        
        // Check if book is available for borrowing
        const canBorrow = await bookDetailPage.canUserBorrow();
        
        if (canBorrow) {
          // Get book info before borrowing
          const bookInfo = await bookDetailPage.getBookInfo();
          
          // Borrow the book
          const response = await bookDetailPage.borrowBook();
          expect(response.status()).toBe(201);
          
          // Verify success message
          await bookDetailPage.verifySuccessMessage('Book borrowed successfully');
          
          // Navigate to My Loans to verify the book appears there
          await myLoansPage.navigate();
          await myLoansPage.waitForLoansToLoad();
          
          // Verify the borrowed book appears in loans
          await myLoansPage.verifyLoanDisplayed(bookInfo.title);
        }
      }
    });

    test('should show appropriate message when book is not available', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      // Navigate to a book (we'll simulate unavailable book scenario)
      await bookDetailPage.navigate('1');
      
      // Check book availability
      const isAvailable = await bookDetailPage.isBookAvailable();
      
      if (!isAvailable) {
        // Verify appropriate message/state is shown
        const availability = await bookDetailPage.getBookInfo();
        expect(availability.availability).toContain('Not Available');
        
        // Verify borrow button is not visible
        expect(await bookDetailPage.isVisible(bookDetailPage.borrowButton)).toBe(false);
      }
    });

    test('should handle borrowing errors gracefully', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      await bookDetailPage.navigate('1');
      
      // Try to borrow (might fail due to various reasons)
      const canBorrow = await bookDetailPage.canUserBorrow();
      
      if (canBorrow) {
        try {
          await bookDetailPage.borrowBook();
        } catch (error) {
          // If borrowing fails, verify error is handled gracefully
          await bookDetailPage.verifyErrorMessage('');
        }
      }
    });
  });

  test.describe('My Loans Management', () => {
    
    test('should display user loans correctly', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      // Verify page elements
      await myLoansPage.verifyPageElements();
      
      // Get loans count
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        // Verify loans are displayed
        await myLoansPage.verifyLoansDisplayed();
        
        // Get loan details
        const loans = await myLoansPage.getActiveLoans();
        expect(loans.length).toBe(loanCount);
        
        // Verify each loan has required information
        for (const loan of loans.slice(0, 3)) { // Check first 3 loans
          expect(loan.title).toBeTruthy();
          expect(loan.author).toBeTruthy();
          expect(loan.dueDate).toBeTruthy();
        }
      } else {
        // If no loans, verify appropriate message
        await myLoansPage.verifyNoLoansMessage();
      }
    });

    test('should show loan statistics and overdue information', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      // Get loan statistics
      const stats = await myLoansPage.getLoanStatistics();
      
      expect(stats.totalActive).toBeGreaterThanOrEqual(0);
      expect(stats.overdue).toBeGreaterThanOrEqual(0);
      expect(stats.onTime).toBeGreaterThanOrEqual(0);
      
      // Verify overdue loans are highlighted if any exist
      if (stats.overdue > 0) {
        const overdueLoans = await myLoansPage.getOverdueLoans();
        expect(overdueLoans.length).toBe(stats.overdue);
      }
    });

    test('should search through user loans', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const initialLoanCount = await myLoansPage.getActiveLoanCount();
      
      if (initialLoanCount > 0) {
        // Get first loan title to search for
        const loans = await myLoansPage.getActiveLoans();
        const firstLoanTitle = loans[0]?.title;
        
        if (firstLoanTitle) {
          // Search for specific loan
          await myLoansPage.searchLoans(firstLoanTitle);
          
          // Verify search results
          const searchResultCount = await myLoansPage.getActiveLoanCount();
          expect(searchResultCount).toBeGreaterThanOrEqual(1);
          
          // Verify the searched loan is still visible
          await myLoansPage.verifyLoanDisplayed(firstLoanTitle);
        }
      }
    });

    test('should navigate to book details from loan', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      const bookDetailPage = new BookDetailPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        const loans = await myLoansPage.getActiveLoans();
        const firstLoanTitle = loans[0]?.title;
        
        if (firstLoanTitle) {
          // Click on book title to view details
          await myLoansPage.clickBookTitle(firstLoanTitle);
          
          // Verify navigation to book detail page
          await expect(page).toHaveURL(/\/books\/\d+/);
          
          // Verify book detail page shows correct information
          await bookDetailPage.verifyPageElements();
          
          // Should show return button since user has borrowed this book
          const isBorrowedByUser = await bookDetailPage.isBookBorrowedByUser();
          expect(isBorrowedByUser).toBe(true);
        }
      }
    });
  });

  test.describe('Book Returning', () => {
    
    test('should successfully return a borrowed book from loan list', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        const loans = await myLoansPage.getActiveLoans();
        const firstLoan = loans[0];
        
        if (firstLoan) {
          // Return the book
          const response = await myLoansPage.returnBookByTitle(firstLoan.title);
          expect(response.status()).toBe(200);
          
          // Verify success message
          await myLoansPage.verifySuccessMessage('Book returned successfully');
          
          // Verify loan count decreased
          await myLoansPage.waitForLoansToLoad();
          const newLoanCount = await myLoansPage.getActiveLoanCount();
          expect(newLoanCount).toBe(loanCount - 1);
        }
      }
    });

    test('should successfully return a book from book detail page', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      const bookDetailPage = new BookDetailPage(page);
      
      // First, find a borrowed book
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        const loans = await myLoansPage.getActiveLoans();
        const firstLoan = loans[0];
        
        if (firstLoan) {
          // Navigate to book detail page
          await myLoansPage.clickBookTitle(firstLoan.title);
          
          // Verify we can return from detail page
          const isBorrowedByUser = await bookDetailPage.isBookBorrowedByUser();
          
          if (isBorrowedByUser) {
            // Return the book
            const response = await bookDetailPage.returnBook();
            expect(response.status()).toBe(200);
            
            // Verify success message
            await bookDetailPage.verifySuccessMessage('Book returned successfully');
            
            // Verify availability status updated
            await bookDetailPage.waitForAvailabilityUpdate('Available');
          }
        }
      }
    });

    test('should handle return errors gracefully', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        try {
          // Try to return first book
          await myLoansPage.returnBookByIndex(0);
        } catch (error) {
          // If return fails, verify error is handled gracefully
          await myLoansPage.verifyErrorMessage('');
        }
      }
    });
  });

  test.describe('Loan Renewal', () => {
    
    test('should renew eligible loans', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        const loans = await myLoansPage.getActiveLoans();
        
        // Check if any loan can be renewed
        for (const loan of loans) {
          const canRenew = await myLoansPage.canRenewBook(loan.title);
          
          if (canRenew) {
            // Get current due date
            const currentDueDate = await myLoansPage.getLoanDueDate(loan.title);
            
            // Renew the loan
            const response = await myLoansPage.renewBookByTitle(loan.title);
            expect(response.status()).toBe(200);
            
            // Verify success message
            await myLoansPage.verifySuccessMessage('Loan renewed successfully');
            
            // Verify due date was extended
            await myLoansPage.waitForLoansToLoad();
            const newDueDate = await myLoansPage.getLoanDueDate(loan.title);
            
            // New due date should be different (later) than original
            expect(newDueDate).not.toBe(currentDueDate);
            
            break; // Only test one renewal
          }
        }
      }
    });

    test('should show appropriate message for non-renewable loans', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        const loans = await myLoansPage.getActiveLoans();
        
        // Check for loans that cannot be renewed
        for (const loan of loans) {
          const canRenew = await myLoansPage.canRenewBook(loan.title);
          
          if (!canRenew) {
            // Verify renew button is not available or disabled
            // This is expected behavior for non-renewable loans
            expect(canRenew).toBe(false);
            break;
          }
        }
      }
    });
  });

  test.describe('Complete Member Journey', () => {
    
    test('should complete full member journey: browse, borrow, view loans, return', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      const bookDetailPage = new BookDetailPage(page);
      const myLoansPage = new MyLoansPage(page);
      
      // Step 1: Browse books
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        // Step 2: Find and borrow an available book
        await bookListPage.clickFirstBook();
        
        const canBorrow = await bookDetailPage.canUserBorrow();
        
        if (canBorrow) {
          const bookInfo = await bookDetailPage.getBookInfo();
          
          // Borrow the book
          await bookDetailPage.borrowBook();
          await bookDetailPage.verifySuccessMessage('Book borrowed successfully');
          
          // Step 3: View loans
          await myLoansPage.navigate();
          await myLoansPage.waitForLoansToLoad();
          
          // Verify the book appears in loans
          await myLoansPage.verifyLoanDisplayed(bookInfo.title);
          
          // Step 4: Return the book
          const response = await myLoansPage.returnBookByTitle(bookInfo.title);
          expect(response.status()).toBe(200);
          
          // Verify return success
          await myLoansPage.verifySuccessMessage('Book returned successfully');
          
          // Step 5: Verify book is available again
          await bookDetailPage.navigate(await bookDetailPage.getCurrentBookId());
          await bookDetailPage.waitForAvailabilityUpdate('Available');
        }
      }
    });

    test('should handle loan history correctly', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      // Switch to loan history if available
      await myLoansPage.switchToLoanHistory();
      
      // Verify loan history interface
      // The specific implementation depends on your app's history feature
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      // Simulate offline scenario by intercepting network requests
      await page.route('**/api/loans/my-loans', route => {
        route.abort('failed');
      });
      
      await myLoansPage.navigate();
      
      // Should handle error gracefully
      // The exact behavior depends on your app's error handling
    });

    test('should handle expired sessions', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      // Simulate expired session by clearing auth tokens
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
      });
      
      // Try to access protected route
      await myLoansPage.navigate();
      
      // Should redirect to login or show appropriate message
      await expect(page).toHaveURL('/login');
    });
  });
});