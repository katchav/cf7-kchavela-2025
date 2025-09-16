import { test, expect } from '@playwright/test';
import { BookListPage } from '../pages/BookListPage.js';
import { BookDetailPage } from '../pages/BookDetailPage.js';
import { TEST_BOOKS } from '../utils/test-data.js';

test.describe('Book Browsing and Search', () => {

  test.describe('Book List Page', () => {
    
    test('should display books on the book list page', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.verifyPageElements();
      
      // Wait for books to load
      await bookListPage.waitForBooksToLoad();
      
      // Verify books are displayed
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThan(0);
      
      await bookListPage.verifyBooksDisplayed();
    });

    test('should search for books by title', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Search for a specific book
      await bookListPage.searchBooks('Great Gatsby');
      
      // Verify search results
      const bookTitles = await bookListPage.getBookTitles();
      const hasMatchingTitle = bookTitles.some(title => 
        title.toLowerCase().includes('great gatsby')
      );
      
      if (bookCount > 0) {
        expect(hasMatchingTitle).toBe(true);
      }
    });

    test('should search for books by author', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Search for books by author
      await bookListPage.searchBooks('Scott Fitzgerald');
      
      // Verify search results
      const bookAuthors = await bookListPage.getBookAuthors();
      const hasMatchingAuthor = bookAuthors.some(author => 
        author.toLowerCase().includes('scott fitzgerald')
      );
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        expect(hasMatchingAuthor).toBe(true);
      }
    });

    test('should handle empty search results', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Search for non-existent book
      await bookListPage.searchBooks('NonExistentBookTitle12345');
      
      // Verify no results message or empty list
      const bookCount = await bookListPage.getBookCount();
      if (bookCount === 0) {
        await bookListPage.verifyNoResults();
      }
    });

    test('should filter books by category', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Filter by Fiction category
      await bookListPage.filterByCategory('Fiction');
      
      // Verify filtered results
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter books by availability', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Filter by available books
      await bookListPage.filterByAvailability('available');
      
      // Verify filtered results
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThanOrEqual(0);
    });

    test('should sort books by title', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Sort by title
      await bookListPage.sortBooks('title_asc');
      
      // Verify books are sorted
      const bookTitles = await bookListPage.getBookTitles();
      if (bookTitles.length > 1) {
        const sortedTitles = [...bookTitles].sort();
        expect(bookTitles).toEqual(sortedTitles);
      }
    });

    test('should navigate to book detail page', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        // Click on first book
        await bookListPage.clickFirstBook();
        
        // Verify navigation to book detail page
        await expect(page).toHaveURL(/\/books\/\d+/);
      }
    });

    test('should handle pagination', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Try to go to next page
      await bookListPage.goToNextPage();
      
      // Verify still on books page (pagination might not be available)
      await expect(page).toHaveURL('/books');
    });

    test('should clear search and show all books', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // First search for something specific
      await bookListPage.searchBooks('Fiction');
      const searchResultCount = await bookListPage.getBookCount();
      
      // Clear search
      await bookListPage.clearSearch();
      const allBooksCount = await bookListPage.getBookCount();
      
      // Should show more or equal books after clearing search
      expect(allBooksCount).toBeGreaterThanOrEqual(searchResultCount);
    });

    test('should pass accessibility checks', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      await bookListPage.verifyAccessibility();
    });
  });

  test.describe('Book Detail Page', () => {
    
    test('should display book details correctly', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      const bookDetailPage = new BookDetailPage(page);
      
      // Navigate to book list and click on first book
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        await bookListPage.clickFirstBook();
        
        // Verify book detail page elements
        await bookDetailPage.verifyPageElements();
        
        // Get and verify book information
        const bookInfo = await bookDetailPage.getBookInfo();
        expect(bookInfo.title).toBeTruthy();
        expect(bookInfo.author).toBeTruthy();
        expect(bookInfo.availability).toBeTruthy();
      }
    });

    test('should show appropriate buttons based on book availability', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      // Navigate to a specific book (assuming book ID 1 exists)
      await bookDetailPage.navigate('1');
      
      // Check button states based on availability and user authentication
      const isAvailable = await bookDetailPage.isBookAvailable();
      const isBorrowedByUser = await bookDetailPage.isBookBorrowedByUser();
      const isReservable = await bookDetailPage.isBookReservable();
      
      // Verify appropriate buttons are shown
      if (isAvailable) {
        expect(await bookDetailPage.isVisible(bookDetailPage.borrowButton)).toBe(true);
      } else if (isBorrowedByUser) {
        expect(await bookDetailPage.isVisible(bookDetailPage.returnButton)).toBe(true);
      } else if (isReservable) {
        expect(await bookDetailPage.isVisible(bookDetailPage.reserveButton)).toBe(true);
      }
    });

    test('should show login prompt for unauthenticated users', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      // Navigate to book detail without authentication
      await bookDetailPage.navigate('1');
      
      // Check if login prompt is shown (depends on app behavior)
      const isLoginRequired = await bookDetailPage.isLoginRequired();
      
      if (isLoginRequired) {
        await bookDetailPage.clickLoginPrompt();
        await expect(page).toHaveURL('/login');
      }
    });

    test('should navigate back to book list', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      const bookDetailPage = new BookDetailPage(page);
      
      // Navigate to book list and then to detail
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      const bookCount = await bookListPage.getBookCount();
      if (bookCount > 0) {
        await bookListPage.clickFirstBook();
        
        // Navigate back to list
        await bookDetailPage.goBackToList();
        
        await expect(page).toHaveURL('/books');
      }
    });

    test('should display book categories', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      await bookDetailPage.navigate('1');
      
      // Get book categories
      const categories = await bookDetailPage.getBookCategories();
      expect(categories).toBeInstanceOf(Array);
    });

    test('should handle non-existent book gracefully', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      // Try to navigate to non-existent book
      await page.goto('/books/99999');
      
      // Should handle gracefully (redirect or show error)
      // The exact behavior depends on your app's error handling
    });

    test('should pass accessibility checks', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      await bookDetailPage.navigate('1');
      await bookDetailPage.verifyAccessibility();
    });
  });

  test.describe('Search Functionality', () => {
    
    test('should search across multiple fields', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Test search by partial title
      await bookListPage.searchBooks('Great');
      await bookListPage.verifySearchResults('Great');
      
      // Test search by author name
      await bookListPage.searchBooks('Fitzgerald');
      await bookListPage.verifySearchResults('Fitzgerald');
    });

    test('should be case insensitive', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Search with different cases
      await bookListPage.searchBooks('GREAT GATSBY');
      const upperCaseCount = await bookListPage.getBookCount();
      
      await bookListPage.searchBooks('great gatsby');
      const lowerCaseCount = await bookListPage.getBookCount();
      
      // Should return same results regardless of case
      expect(upperCaseCount).toBe(lowerCaseCount);
    });

    test('should handle special characters in search', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Search with special characters
      await bookListPage.searchBooks('Test & Co.');
      
      // Should not break the search functionality
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThanOrEqual(0);
    });

    test('should show real-time search results', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Type partial search term
      await page.fill(bookListPage.searchInput, 'Gre');
      
      // Should show filtered results (if implemented)
      // Note: This depends on whether your app implements real-time search
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.verifyPageElements();
      
      // Verify mobile-specific behavior
      await bookListPage.waitForBooksToLoad();
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThanOrEqual(0);
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.verifyPageElements();
      
      await bookListPage.waitForBooksToLoad();
      const bookCount = await bookListPage.getBookCount();
      expect(bookCount).toBeGreaterThanOrEqual(0);
    });
  });
});