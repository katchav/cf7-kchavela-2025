import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../utils/test-data.js';

/**
 * Page Object for My Loans page
 */
export class MyLoansPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.pageTitle = 'h1:has-text("My Loans"), h1:has-text("My Borrowed Books")';
    this.loanCards = '[data-testid="loan-card"], .loan-card';
    this.bookTitles = '[data-testid="book-title"], .book-title';
    this.bookAuthors = '[data-testid="book-author"], .book-author';
    this.borrowDates = '[data-testid="borrow-date"], .borrow-date';
    this.dueDates = '[data-testid="due-date"], .due-date';
    this.returnButtons = 'button:has-text("Return"), [data-testid="return-button"]';
    this.renewButtons = 'button:has-text("Renew"), [data-testid="renew-button"]';
    this.overdueLoans = '[data-testid="overdue-loan"], .overdue-loan';
    this.activeLoansTabs = '[data-testid="active-loans"], button:has-text("Active Loans")';
    this.loanHistoryTab = '[data-testid="loan-history"], button:has-text("Loan History")';
    this.noLoansMessage = '[data-testid="no-loans"], .no-loans';
    this.successMessage = '.bg-green-50, [data-testid="success-message"]';
    this.errorMessage = '.bg-red-50, [data-testid="error-message"]';
    this.loadingSpinner = '[data-testid="loading-spinner"], .loading';
    this.searchInput = 'input[placeholder*="Search"], input[name="search"]';
    this.filterSelect = 'select[name="filter"], [data-testid="loan-filter"]';
  }

  /**
   * Navigate to my loans page
   */
  async navigate() {
    await this.goto('/my-loans');
    await this.waitForSelector(this.pageTitle);
  }

  /**
   * Wait for loans to load
   */
  async waitForLoansToLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.waitForLoadingToComplete();
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
   * Get all active loans
   * @returns {Promise<Array>} Array of loan information
   */
  async getActiveLoans() {
    await this.waitForLoansToLoad();
    
    try {
      await this.waitForSelector(this.loanCards, 5000);
      const loanCount = await this.countElements(this.loanCards);
      const loans = [];
      
      for (let i = 0; i < loanCount; i++) {
        const loanCard = this.page.locator(this.loanCards).nth(i);
        
        const title = await loanCard.locator(this.bookTitles).textContent();
        const author = await loanCard.locator(this.bookAuthors).textContent();
        const borrowDate = await this.isVisible(this.borrowDates) 
          ? await loanCard.locator(this.borrowDates).textContent() 
          : null;
        const dueDate = await this.isVisible(this.dueDates) 
          ? await loanCard.locator(this.dueDates).textContent() 
          : null;
        
        loans.push({
          title: title?.trim(),
          author: author?.trim(),
          borrowDate: borrowDate?.trim(),
          dueDate: dueDate?.trim(),
          index: i
        });
      }
      
      return loans;
    } catch {
      return [];
    }
  }

  /**
   * Return a book by title
   * @param {string} bookTitle - Title of book to return
   */
  async returnBookByTitle(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    const returnButton = loanCard.locator(this.returnButtons);
    
    const responsePromise = this.waitForApiResponse('/api/loans/', { 
      method: 'PUT' 
    });
    
    await returnButton.click();
    const response = await responsePromise;
    
    await this.waitForLoadingToComplete();
    return response;
  }

  /**
   * Return book by index
   * @param {number} index - Index of loan to return
   */
  async returnBookByIndex(index) {
    await this.waitForSelector(this.loanCards);
    const loanCard = this.page.locator(this.loanCards).nth(index);
    const returnButton = loanCard.locator(this.returnButtons);
    
    const responsePromise = this.waitForApiResponse('/api/loans/', { 
      method: 'PUT' 
    });
    
    await returnButton.click();
    const response = await responsePromise;
    
    await this.waitForLoadingToComplete();
    return response;
  }

  /**
   * Renew a book loan by title
   * @param {string} bookTitle - Title of book to renew
   */
  async renewBookByTitle(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    const renewButton = loanCard.locator(this.renewButtons);
    
    if (await renewButton.isVisible()) {
      const responsePromise = this.waitForApiResponse('/api/loans/', { 
        method: 'PUT' 
      });
      
      await renewButton.click();
      const response = await responsePromise;
      
      await this.waitForLoadingToComplete();
      return response;
    }
    
    throw new Error('Renew button not available for this book');
  }

  /**
   * Get number of active loans
   * @returns {Promise<number>} Number of active loans
   */
  async getActiveLoanCount() {
    try {
      await this.waitForSelector(this.loanCards, 5000);
      return await this.countElements(this.loanCards);
    } catch {
      return 0;
    }
  }

  /**
   * Get overdue loans
   * @returns {Promise<Array>} Array of overdue loan information
   */
  async getOverdueLoans() {
    try {
      await this.waitForSelector(this.overdueLoans, 5000);
      const overdueCount = await this.countElements(this.overdueLoans);
      const overdueLoans = [];
      
      for (let i = 0; i < overdueCount; i++) {
        const loanCard = this.page.locator(this.overdueLoans).nth(i);
        const title = await loanCard.locator(this.bookTitles).textContent();
        const dueDate = await loanCard.locator(this.dueDates).textContent();
        
        overdueLoans.push({
          title: title?.trim(),
          dueDate: dueDate?.trim(),
          index: i
        });
      }
      
      return overdueLoans;
    } catch {
      return [];
    }
  }

  /**
   * Switch to loan history tab
   */
  async switchToLoanHistory() {
    if (await this.isVisible(this.loanHistoryTab)) {
      const responsePromise = this.waitForApiResponse('/api/loans/history');
      await this.clickElement(this.loanHistoryTab);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Switch to active loans tab
   */
  async switchToActiveLoans() {
    if (await this.isVisible(this.activeLoansTabs)) {
      const responsePromise = this.waitForApiResponse('/api/loans/my-loans');
      await this.clickElement(this.activeLoansTabs);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Search loans
   * @param {string} searchTerm - Search term
   */
  async searchLoans(searchTerm) {
    if (await this.isVisible(this.searchInput)) {
      await this.fillInput(this.searchInput, searchTerm);
      await this.pressKey('Enter');
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Filter loans
   * @param {string} filterOption - Filter option
   */
  async filterLoans(filterOption) {
    if (await this.isVisible(this.filterSelect)) {
      await this.selectOption(this.filterSelect, filterOption);
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Click on book title to view details
   * @param {string} bookTitle - Book title to click
   */
  async clickBookTitle(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    const titleLink = loanCard.locator(this.bookTitles).locator('a');
    
    if (await titleLink.isVisible()) {
      await titleLink.click();
      await this.page.waitForURL(/\/books\/\d+/);
    }
  }

  /**
   * Verify page elements are visible
   */
  async verifyPageElements() {
    await expect(this.page.locator(this.pageTitle)).toBeVisible();
  }

  /**
   * Verify no loans message is displayed
   */
  async verifyNoLoansMessage() {
    await expect(this.page.locator(this.noLoansMessage)).toBeVisible();
  }

  /**
   * Verify loans are displayed
   */
  async verifyLoansDisplayed() {
    await expect(this.page.locator(this.loanCards).first()).toBeVisible();
  }

  /**
   * Verify specific loan is displayed
   * @param {string} bookTitle - Book title to verify
   */
  async verifyLoanDisplayed(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    await expect(loanCard).toBeVisible();
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
   * Check if book can be renewed
   * @param {string} bookTitle - Book title to check
   * @returns {Promise<boolean>} True if renewable
   */
  async canRenewBook(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    const renewButton = loanCard.locator(this.renewButtons);
    return await renewButton.isVisible() && !(await renewButton.isDisabled());
  }

  /**
   * Get loan due date
   * @param {string} bookTitle - Book title
   * @returns {Promise<string>} Due date
   */
  async getLoanDueDate(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    const dueDateElement = loanCard.locator(this.dueDates);
    return await dueDateElement.textContent();
  }

  /**
   * Check if loan is overdue
   * @param {string} bookTitle - Book title
   * @returns {Promise<boolean>} True if overdue
   */
  async isLoanOverdue(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    const overdueIndicator = loanCard.locator('.overdue, .text-red-600, [data-testid="overdue"]');
    return await overdueIndicator.isVisible();
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    await this.navigate();
    await this.checkAccessibility();
  }

  /**
   * Get loan statistics
   * @returns {Promise<Object>} Loan statistics
   */
  async getLoanStatistics() {
    await this.waitForLoansToLoad();
    
    const totalLoans = await this.getActiveLoanCount();
    const overdueLoans = await this.getOverdueLoans();
    const overdueCount = overdueLoans.length;
    
    return {
      totalActive: totalLoans,
      overdue: overdueCount,
      onTime: totalLoans - overdueCount
    };
  }

  /**
   * Verify loan card contains required information
   * @param {string} bookTitle - Book title to check
   */
  async verifyLoanCardInfo(bookTitle) {
    const loanCard = this.page.locator(this.loanCards).filter({ 
      hasText: bookTitle 
    });
    
    await expect(loanCard.locator(this.bookTitles)).toContainText(bookTitle);
    await expect(loanCard.locator(this.bookAuthors)).toBeVisible();
    await expect(loanCard.locator(this.dueDates)).toBeVisible();
    await expect(loanCard.locator(this.returnButtons)).toBeVisible();
  }
}