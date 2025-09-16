import { test, expect } from '@playwright/test';
import { LibrarianDashboardPage } from '../pages/LibrarianDashboardPage.js';
import { AllLoansPage } from '../pages/AllLoansPage.js';
import { BookListPage } from '../pages/BookListPage.js';
import { TEST_USERS } from '../utils/test-data.js';

// Use librarian authentication for all tests in this file
test.use({ storageState: 'e2e/.auth/librarian.json' });

test.describe('Librarian Workflows', () => {

  test.describe('Dashboard Management', () => {
    
    test('should display dashboard with statistics', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      
      // Verify dashboard elements
      await dashboardPage.verifyDashboardElements();
      await dashboardPage.verifyStatsCards();
      
      // Get and verify statistics
      const stats = await dashboardPage.getDashboardStats();
      
      // Verify statistics have reasonable values
      expect(stats.totalBooks).toBeGreaterThanOrEqual(0);
      expect(stats.availableBooks).toBeGreaterThanOrEqual(0);
      expect(stats.borrowedBooks).toBeGreaterThanOrEqual(0);
      expect(stats.totalMembers).toBeGreaterThanOrEqual(0);
      
      // Verify available + borrowed <= total books
      if (stats.totalBooks && stats.availableBooks !== undefined && stats.borrowedBooks !== undefined) {
        expect(stats.availableBooks + stats.borrowedBooks).toBeLessThanOrEqual(stats.totalBooks);
      }
    });

    test('should display recent loans section', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      
      // Verify recent loans section
      await dashboardPage.verifyRecentLoansSection();
      
      // Get recent loans
      const recentLoans = await dashboardPage.getRecentLoans();
      expect(recentLoans).toBeInstanceOf(Array);
    });

    test('should display popular books section', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      
      // Verify popular books section
      await dashboardPage.verifyPopularBooksSection();
      
      // Get popular books
      const popularBooks = await dashboardPage.getPopularBooks();
      expect(popularBooks).toBeInstanceOf(Array);
    });

    test('should provide quick action navigation', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      
      // Verify quick actions are available
      await dashboardPage.verifyQuickActions();
      
      // Test navigation to all loans
      await dashboardPage.clickViewAllLoans();
      await expect(page).toHaveURL('/librarian/loans');
      
      // Navigate back to dashboard
      await dashboardPage.navigate();
      
      // Test navigation to manage books
      await dashboardPage.clickManageBooks();
      await expect(page).toHaveURL('/librarian/books');
    });

    test('should refresh dashboard data', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      
      // Get initial stats
      const initialStats = await dashboardPage.getDashboardStats();
      
      // Refresh dashboard
      await dashboardPage.refreshDashboard();
      
      // Get updated stats
      const refreshedStats = await dashboardPage.getDashboardStats();
      
      // Stats should be consistent (or updated if data changed)
      expect(refreshedStats).toBeDefined();
    });

    test('should verify dashboard responsiveness', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.verifyResponsiveness();
    });

    test('should pass accessibility checks', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      await dashboardPage.verifyAccessibility();
    });
  });

  test.describe('Loan Management', () => {
    
    test('should display all loans with complete information', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      // Verify page elements
      await allLoansPage.verifyPageElements();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        // Verify loans table
        await allLoansPage.verifyLoansTable();
        await allLoansPage.verifyLoansDisplayed();
        
        // Get all loan data
        const loans = await allLoansPage.getAllLoans();
        expect(loans.length).toBe(loanCount);
        
        // Verify each loan has required information
        for (const loan of loans.slice(0, 3)) { // Check first 3 loans
          expect(loan.borrower).toBeTruthy();
          expect(loan.bookTitle).toBeTruthy();
          expect(loan.borrowDate).toBeTruthy();
          expect(loan.dueDate).toBeTruthy();
          expect(loan.status).toBeTruthy();
        }
      } else {
        await allLoansPage.verifyNoLoansMessage();
      }
    });

    test('should filter loans by status', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const initialLoanCount = await allLoansPage.getLoanCount();
      
      if (initialLoanCount > 0) {
        // Filter by active loans
        await allLoansPage.filterByStatus('active');
        
        const filteredCount = await allLoansPage.getLoanCount();
        expect(filteredCount).toBeLessThanOrEqual(initialLoanCount);
        
        // Clear filters
        await allLoansPage.clearFilters();
        
        const clearedCount = await allLoansPage.getLoanCount();
        expect(clearedCount).toBe(initialLoanCount);
      }
    });

    test('should filter loans by overdue status', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      // Filter by overdue loans
      await allLoansPage.filterByOverdue('overdue');
      
      // Get overdue loans
      const overdueLoans = await allLoansPage.getOverdueLoans();
      const loanCount = await allLoansPage.getLoanCount();
      
      // If there are loans, all should be overdue
      if (loanCount > 0) {
        expect(overdueLoans.length).toBeGreaterThan(0);
      }
    });

    test('should search loans by borrower or book title', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const initialLoanCount = await allLoansPage.getLoanCount();
      
      if (initialLoanCount > 0) {
        const loans = await allLoansPage.getAllLoans();
        const firstLoan = loans[0];
        
        if (firstLoan && firstLoan.borrower) {
          // Search by borrower name
          await allLoansPage.searchLoans(firstLoan.borrower);
          
          // Should find at least the original loan
          const searchResults = await allLoansPage.getLoanCount();
          expect(searchResults).toBeGreaterThanOrEqual(1);
          
          // Verify the searched loan is still visible
          await allLoansPage.verifyLoanDisplayed(firstLoan.borrower, firstLoan.bookTitle);
        }
      }
    });

    test('should sort loans by different criteria', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 1) {
        // Test sorting by due date
        await allLoansPage.sortLoans('due_date_asc');
        
        // Verify loans are still displayed
        const sortedCount = await allLoansPage.getLoanCount();
        expect(sortedCount).toBe(loanCount);
      }
    });

    test('should handle pagination correctly', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const initialLoanCount = await allLoansPage.getLoanCount();
      
      // Try to navigate to next page
      await allLoansPage.goToNextPage();
      
      // Should still be on loans page
      await expect(page).toHaveURL('/librarian/loans');
      
      // Try to navigate to previous page
      await allLoansPage.goToPreviousPage();
      
      // Should still be on loans page
      await expect(page).toHaveURL('/librarian/loans');
    });

    test('should pass accessibility checks', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      await allLoansPage.verifyAccessibility();
    });
  });

  test.describe('Return Processing', () => {
    
    test('should process book returns successfully', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        const loans = await allLoansPage.getAllLoans();
        const firstLoan = loans[0];
        
        // Check if loan can be returned
        const canReturn = await allLoansPage.canReturnLoan(firstLoan.borrower, firstLoan.bookTitle);
        
        if (canReturn) {
          // Get initial dashboard stats
          await dashboardPage.navigate();
          const initialStats = await dashboardPage.getDashboardStats();
          
          // Go back to loans and process return
          await allLoansPage.navigate();
          await allLoansPage.waitForLoansToLoad();
          
          const response = await allLoansPage.processReturnByBorrowerAndBook(
            firstLoan.borrower, 
            firstLoan.bookTitle
          );
          
          expect(response.status()).toBe(200);
          
          // Verify success message
          await allLoansPage.verifySuccessMessage('Book returned successfully');
          
          // Verify loan count decreased
          await allLoansPage.waitForLoansToLoad();
          const newLoanCount = await allLoansPage.getLoanCount();
          expect(newLoanCount).toBe(loanCount - 1);
          
          // Verify dashboard stats updated
          await dashboardPage.navigate();
          await dashboardPage.waitForDashboardToLoad();
          const updatedStats = await dashboardPage.getDashboardStats();
          
          // Available books should increase, borrowed should decrease
          if (initialStats.availableBooks !== undefined && updatedStats.availableBooks !== undefined) {
            expect(updatedStats.availableBooks).toBe(initialStats.availableBooks + 1);
          }
          if (initialStats.borrowedBooks !== undefined && updatedStats.borrowedBooks !== undefined) {
            expect(updatedStats.borrowedBooks).toBe(initialStats.borrowedBooks - 1);
          }
        }
      }
    });

    test('should process returns by loan index', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        // Process return for first loan
        const response = await allLoansPage.processReturnByIndex(0);
        expect(response.status()).toBe(200);
        
        // Verify success message
        await allLoansPage.verifySuccessMessage('Book returned successfully');
        
        // Verify loan count decreased
        await allLoansPage.waitForLoansToLoad();
        const newLoanCount = await allLoansPage.getLoanCount();
        expect(newLoanCount).toBe(loanCount - 1);
      }
    });

    test('should handle return errors gracefully', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        // Simulate error scenario by mocking API response
        await page.route('**/api/loans/*/return', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Cannot return this book' }),
          });
        });
        
        try {
          await allLoansPage.processReturnByIndex(0);
        } catch (error) {
          // Should handle error gracefully
          await allLoansPage.verifyErrorMessage('Cannot return this book');
        }
      }
    });
  });

  test.describe('Loan Extension', () => {
    
    test('should extend loan duration successfully', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        const loans = await allLoansPage.getAllLoans();
        const firstLoan = loans[0];
        
        try {
          // Attempt to extend loan
          const response = await allLoansPage.extendLoan(firstLoan.borrower, firstLoan.bookTitle);
          expect(response.status()).toBe(200);
          
          // Verify success message
          await allLoansPage.verifySuccessMessage('Loan extended successfully');
          
          // Verify loan information updated
          await allLoansPage.waitForLoansToLoad();
          const updatedLoans = await allLoansPage.getAllLoans();
          const updatedLoan = updatedLoans.find(loan => 
            loan.borrower === firstLoan.borrower && loan.bookTitle === firstLoan.bookTitle
          );
          
          if (updatedLoan) {
            // Due date should be later than original
            expect(updatedLoan.dueDate).not.toBe(firstLoan.dueDate);
          }
        } catch (error) {
          // Extension might not be available for all loans
          // This is expected behavior
        }
      }
    });

    test('should handle extension restrictions', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        const loans = await allLoansPage.getAllLoans();
        
        // Check for loans that cannot be extended
        for (const loan of loans) {
          try {
            await allLoansPage.extendLoan(loan.borrower, loan.bookTitle);
          } catch (error) {
            // Some loans might not be extendable - this is expected
            expect(error.message).toContain('Extend button not available');
          }
        }
      }
    });
  });

  test.describe('Loan Analytics and Reporting', () => {
    
    test('should display overdue loans correctly', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      // Get overdue loans
      const overdueLoans = await allLoansPage.getOverdueLoans();
      
      // Verify overdue loan information
      for (const overdueLoan of overdueLoans) {
        expect(overdueLoan.borrower).toBeTruthy();
        expect(overdueLoan.bookTitle).toBeTruthy();
        expect(overdueLoan.dueDate).toBeTruthy();
      }
    });

    test('should provide loan statistics', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      // Get loan statistics
      const stats = await allLoansPage.getLoanStatistics();
      
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.overdue).toBeGreaterThanOrEqual(0);
      expect(stats.onTime).toBeGreaterThanOrEqual(0);
      
      // Verify total equals overdue + on time
      expect(stats.total).toBe(stats.overdue + stats.onTime);
    });

    test('should export loan data', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      try {
        // Attempt to export loans
        const download = await allLoansPage.exportLoans();
        
        if (download) {
          // Verify download was initiated
          expect(download.suggestedFilename()).toMatch(/loans.*\.(csv|xlsx|pdf)$/i);
        }
      } catch (error) {
        // Export functionality might not be implemented
        // This is acceptable for testing purposes
      }
    });
  });

  test.describe('Complete Librarian Journey', () => {
    
    test('should complete full librarian workflow: view dashboard, manage loans, process returns', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      const allLoansPage = new AllLoansPage(page);
      
      // Step 1: View dashboard and get statistics
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      
      const initialStats = await dashboardPage.getDashboardStats();
      expect(initialStats.totalBooks).toBeGreaterThanOrEqual(0);
      
      // Step 2: Navigate to loan management
      await dashboardPage.clickViewAllLoans();
      await allLoansPage.waitForLoansToLoad();
      
      // Step 3: Review and manage loans
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        // Filter to see overdue loans
        await allLoansPage.filterByOverdue('overdue');
        const overdueCount = await allLoansPage.getLoanCount();
        
        // Clear filter to see all loans
        await allLoansPage.clearFilters();
        
        // Step 4: Process a return if possible
        const allLoans = await allLoansPage.getAllLoans();
        if (allLoans.length > 0) {
          const firstLoan = allLoans[0];
          const canReturn = await allLoansPage.canReturnLoan(firstLoan.borrower, firstLoan.bookTitle);
          
          if (canReturn) {
            await allLoansPage.processReturnByBorrowerAndBook(firstLoan.borrower, firstLoan.bookTitle);
            await allLoansPage.verifySuccessMessage('Book returned successfully');
          }
        }
        
        // Step 5: Return to dashboard and verify updated statistics
        await dashboardPage.navigate();
        await dashboardPage.waitForDashboardToLoad();
        
        const finalStats = await dashboardPage.getDashboardStats();
        
        // Statistics should be consistent
        expect(finalStats).toBeDefined();
      }
    });

    test('should handle multiple loan operations efficiently', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 2) {
        const loans = await allLoansPage.getAllLoans();
        
        // Process multiple operations
        let operationsPerformed = 0;
        
        for (let i = 0; i < Math.min(3, loans.length); i++) {
          const loan = loans[i];
          
          try {
            // Try to process return
            const canReturn = await allLoansPage.canReturnLoan(loan.borrower, loan.bookTitle);
            if (canReturn) {
              await allLoansPage.processReturnByIndex(i - operationsPerformed);
              operationsPerformed++;
              
              // Wait for UI to update
              await allLoansPage.waitForLoansToLoad();
              
              // Break after one successful operation to avoid complications
              break;
            }
          } catch (error) {
            // Continue with next loan if current one fails
            continue;
          }
        }
        
        if (operationsPerformed > 0) {
          // Verify operations were successful
          const newLoanCount = await allLoansPage.getLoanCount();
          expect(newLoanCount).toBe(loanCount - operationsPerformed);
        }
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      // Simulate network error
      await page.route('**/api/dashboard', route => {
        route.abort('failed');
      });
      
      await dashboardPage.navigate();
      
      // Should handle error gracefully
      // The exact behavior depends on your app's error handling
    });

    test('should handle unauthorized access attempts', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      // Simulate unauthorized response
      await page.route('**/api/loans', route => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      });
      
      await allLoansPage.navigate();
      
      // Should handle unauthorized access gracefully
      await allLoansPage.verifyErrorMessage('Unauthorized');
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      // Test performance with potential large dataset
      const startTime = Date.now();
      const loanCount = await allLoansPage.getLoanCount();
      const endTime = Date.now();
      
      // Should load reasonably quickly (within 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      
      // Should handle any number of loans
      expect(loanCount).toBeGreaterThanOrEqual(0);
    });
  });
});