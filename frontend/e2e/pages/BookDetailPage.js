import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../utils/test-data.js';

/**
 * Page Object for Book Detail page
 */
export class BookDetailPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.bookTitle = '[data-testid="book-title"], h1';
    this.bookAuthor = '[data-testid="book-author"], .book-author';
    this.bookIsbn = '[data-testid="book-isbn"], .book-isbn';
    this.bookDescription = '[data-testid="book-description"], .book-description';
    this.bookCategories = '[data-testid="book-categories"], .book-categories';
    this.bookAvailability = '[data-testid="book-availability"], .book-availability';
    this.borrowButton = 'button:has-text("Borrow"), [data-testid="borrow-button"]';
    this.returnButton = 'button:has-text("Return"), [data-testid="return-button"]';
    this.reserveButton = 'button:has-text("Reserve"), [data-testid="reserve-button"]';
    this.backToListButton = 'button:has-text("Back"), a:has-text("Back to Books")';
    this.loginPrompt = '[data-testid="login-prompt"], .login-prompt';
    this.successMessage = '.bg-green-50, [data-testid="success-message"]';
    this.errorMessage = '.bg-red-50, [data-testid="error-message"]';
    this.loadingSpinner = '[data-testid="loading-spinner"], .loading';
    this.bookCover = '[data-testid="book-cover"], .book-cover';
  }

  /**
   * Navigate to book detail page
   * @param {string|number} bookId - Book ID
   */
  async navigate(bookId) {
    await this.goto(`/books/${bookId}`);
    await this.waitForSelector(this.bookTitle);
  }

  /**
   * Borrow the book
   */
  async borrowBook() {
    await this.waitForSelector(this.borrowButton);
    
    const responsePromise = this.waitForApiResponse('/api/loans', { 
      method: 'POST' 
    });
    
    await this.clickElement(this.borrowButton);
    const response = await responsePromise;
    
    // Wait for UI to update
    await this.waitForLoadingToComplete();
    
    return response;
  }

  /**
   * Return the book
   */
  async returnBook() {
    await this.waitForSelector(this.returnButton);
    
    const responsePromise = this.waitForApiResponse('/api/loans/', { 
      method: 'PUT' 
    });
    
    await this.clickElement(this.returnButton);
    const response = await responsePromise;
    
    // Wait for UI to update
    await this.waitForLoadingToComplete();
    
    return response;
  }

  /**
   * Reserve the book
   */
  async reserveBook() {
    if (await this.isVisible(this.reserveButton)) {
      const responsePromise = this.waitForApiResponse('/api/reservations', { 
        method: 'POST' 
      });
      
      await this.clickElement(this.reserveButton);
      const response = await responsePromise;
      
      await this.waitForLoadingToComplete();
      return response;
    }
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete() {
    try {
      await this.page.waitForSelector(this.loadingSpinner, { timeout: 2000 });
      await this.page.waitForSelector(this.loadingSpinner, { 
        state: 'hidden', 
        timeout: TIMEOUTS.LONG 
      });
    } catch {
      // Loading spinner might not appear for fast operations
    }
  }

  /**
   * Get book information
   * @returns {Promise<Object>} Book details
   */
  async getBookInfo() {
    await this.waitForSelector(this.bookTitle);
    
    const title = await this.getTextContent(this.bookTitle);
    const author = await this.getTextContent(this.bookAuthor);
    const isbn = await this.isVisible(this.bookIsbn) 
      ? await this.getTextContent(this.bookIsbn) 
      : null;
    const description = await this.isVisible(this.bookDescription) 
      ? await this.getTextContent(this.bookDescription) 
      : null;
    const availability = await this.getTextContent(this.bookAvailability);
    
    return {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn?.trim(),
      description: description?.trim(),
      availability: availability.trim()
    };
  }

  /**
   * Get book categories
   * @returns {Promise<string[]>} Array of categories
   */
  async getBookCategories() {
    if (await this.isVisible(this.bookCategories)) {
      const categoriesText = await this.getTextContent(this.bookCategories);
      return categoriesText.split(',').map(cat => cat.trim());
    }
    return [];
  }

  /**
   * Check if book is available for borrowing
   * @returns {Promise<boolean>} True if available
   */
  async isBookAvailable() {
    return await this.isVisible(this.borrowButton);
  }

  /**
   * Check if book is currently borrowed by user
   * @returns {Promise<boolean>} True if borrowed by user
   */
  async isBookBorrowedByUser() {
    return await this.isVisible(this.returnButton);
  }

  /**
   * Check if book can be reserved
   * @returns {Promise<boolean>} True if reservable
   */
  async isBookReservable() {
    return await this.isVisible(this.reserveButton);
  }

  /**
   * Check if login is required
   * @returns {Promise<boolean>} True if login prompt is shown
   */
  async isLoginRequired() {
    return await this.isVisible(this.loginPrompt);
  }

  /**
   * Click back to list button
   */
  async goBackToList() {
    if (await this.isVisible(this.backToListButton)) {
      await this.clickElement(this.backToListButton);
      await this.page.waitForURL('/books');
    } else {
      // Use browser back button as fallback
      await this.page.goBack();
    }
  }

  /**
   * Verify page elements are visible
   */
  async verifyPageElements() {
    await expect(this.page.locator(this.bookTitle)).toBeVisible();
    await expect(this.page.locator(this.bookAuthor)).toBeVisible();
    await expect(this.page.locator(this.bookAvailability)).toBeVisible();
  }

  /**
   * Verify book details match expected data
   * @param {Object} expectedBook - Expected book data
   */
  async verifyBookDetails(expectedBook) {
    const bookInfo = await this.getBookInfo();
    
    expect(bookInfo.title).toContain(expectedBook.title);
    expect(bookInfo.author).toContain(expectedBook.author);
    
    if (expectedBook.isbn) {
      expect(bookInfo.isbn).toContain(expectedBook.isbn);
    }
  }

  /**
   * Verify success message is displayed
   * @param {string} expectedMessage - Expected success message
   */
  async verifySuccessMessage(expectedMessage) {
    const successElement = this.page.locator(this.successMessage);
    await expect(successElement).toBeVisible();
    
    if (expectedMessage) {
      await expect(successElement).toContainText(expectedMessage);
    }
  }

  /**
   * Verify error message is displayed
   * @param {string} expectedMessage - Expected error message
   */
  async verifyErrorMessage(expectedMessage) {
    const errorElement = this.page.locator(this.errorMessage);
    await expect(errorElement).toBeVisible();
    
    if (expectedMessage) {
      await expect(errorElement).toContainText(expectedMessage);
    }
  }

  /**
   * Wait for book availability to update
   * @param {string} expectedStatus - Expected availability status
   */
  async waitForAvailabilityUpdate(expectedStatus) {
    await this.page.waitForFunction(
      ({ selector, expectedStatus }) => {
        const element = document.querySelector(selector);
        return element && element.textContent.includes(expectedStatus);
      },
      { selector: this.bookAvailability, expectedStatus },
      { timeout: TIMEOUTS.MEDIUM }
    );
  }

  /**
   * Verify book cover is displayed
   */
  async verifyBookCover() {
    if (await this.isVisible(this.bookCover)) {
      await expect(this.page.locator(this.bookCover)).toBeVisible();
    }
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    await this.checkAccessibility();
  }

  /**
   * Get current book ID from URL
   * @returns {Promise<string>} Book ID
   */
  async getCurrentBookId() {
    const url = this.page.url();
    const match = url.match(/\/books\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if user has permission to borrow
   * @returns {Promise<boolean>} True if can borrow
   */
  async canUserBorrow() {
    // Check if borrow button is visible and not disabled
    if (await this.isVisible(this.borrowButton)) {
      const isDisabled = await this.page.locator(this.borrowButton).isDisabled();
      return !isDisabled;
    }
    return false;
  }

  /**
   * Verify page title matches book title
   */
  async verifyPageTitle() {
    const bookTitle = await this.getTextContent(this.bookTitle);
    await expect(this.page).toHaveTitle(new RegExp(bookTitle, 'i'));
  }

  /**
   * Click login prompt link
   */
  async clickLoginPrompt() {
    if (await this.isVisible(this.loginPrompt)) {
      const loginLink = this.page.locator(this.loginPrompt).locator('a[href="/login"]');
      await loginLink.click();
      await this.page.waitForURL('/login');
    }
  }

  /**
   * Verify button states based on book availability and user status
   * @param {Object} expectedStates - Expected button states
   */
  async verifyButtonStates(expectedStates) {
    if (expectedStates.borrowVisible !== undefined) {
      const borrowVisible = await this.isVisible(this.borrowButton);
      expect(borrowVisible).toBe(expectedStates.borrowVisible);
    }
    
    if (expectedStates.returnVisible !== undefined) {
      const returnVisible = await this.isVisible(this.returnButton);
      expect(returnVisible).toBe(expectedStates.returnVisible);
    }
    
    if (expectedStates.reserveVisible !== undefined) {
      const reserveVisible = await this.isVisible(this.reserveButton);
      expect(reserveVisible).toBe(expectedStates.reserveVisible);
    }
  }
}