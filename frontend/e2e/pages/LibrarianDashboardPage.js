import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../utils/test-data.js';

/**
 * Page Object for Librarian Dashboard page
 */
export class LibrarianDashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.pageTitle = 'h1:has-text("Dashboard"), h1:has-text("Librarian Dashboard")';
    this.statsCards = '[data-testid="stats-card"], .stats-card';
    this.totalBooksCard = '[data-testid="total-books"], .total-books';
    this.availableBooksCard = '[data-testid="available-books"], .available-books';
    this.borrowedBooksCard = '[data-testid="borrowed-books"], .borrowed-books';
    this.totalMembersCard = '[data-testid="total-members"], .total-members';
    this.activeLoansCard = '[data-testid="active-loans"], .active-loans';
    this.overdueLoansCard = '[data-testid="overdue-loans"], .overdue-loans';
    this.recentLoansSection = '[data-testid="recent-loans"], .recent-loans';
    this.recentLoanItems = '[data-testid="recent-loan-item"], .recent-loan-item';
    this.popularBooksSection = '[data-testid="popular-books"], .popular-books';
    this.popularBookItems = '[data-testid="popular-book-item"], .popular-book-item';
    this.quickActionsSection = '[data-testid="quick-actions"], .quick-actions';
    this.viewAllLoansButton = 'button:has-text("View All Loans"), a[href="/librarian/loans"]';
    this.manageBooksButton = 'button:has-text("Manage Books"), a[href="/librarian/books"]';
    this.addBookButton = 'button:has-text("Add Book"), [data-testid="add-book-button"]';
    this.refreshButton = 'button:has-text("Refresh"), [data-testid="refresh-button"]';
    this.loadingSpinner = '[data-testid="loading-spinner"], .loading';
    this.errorMessage = '.bg-red-50, [data-testid="error-message"]';
    this.chartContainer = '[data-testid="chart-container"], .chart-container';
  }

  /**
   * Navigate to librarian dashboard
   */
  async navigate() {
    await this.goto('/librarian/dashboard');
    await this.waitForSelector(this.pageTitle);
  }

  /**
   * Wait for dashboard data to load
   */
  async waitForDashboardToLoad() {
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
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    await this.waitForDashboardToLoad();
    
    const stats = {};
    
    if (await this.isVisible(this.totalBooksCard)) {
      const totalBooksText = await this.getTextContent(this.totalBooksCard);
      stats.totalBooks = this.extractNumber(totalBooksText);
    }
    
    if (await this.isVisible(this.availableBooksCard)) {
      const availableBooksText = await this.getTextContent(this.availableBooksCard);
      stats.availableBooks = this.extractNumber(availableBooksText);
    }
    
    if (await this.isVisible(this.borrowedBooksCard)) {
      const borrowedBooksText = await this.getTextContent(this.borrowedBooksCard);
      stats.borrowedBooks = this.extractNumber(borrowedBooksText);
    }
    
    if (await this.isVisible(this.totalMembersCard)) {
      const totalMembersText = await this.getTextContent(this.totalMembersCard);
      stats.totalMembers = this.extractNumber(totalMembersText);
    }
    
    if (await this.isVisible(this.activeLoansCard)) {
      const activeLoansText = await this.getTextContent(this.activeLoansCard);
      stats.activeLoans = this.extractNumber(activeLoansText);
    }
    
    if (await this.isVisible(this.overdueLoansCard)) {
      const overdueLoansText = await this.getTextContent(this.overdueLoansCard);
      stats.overdueLoans = this.extractNumber(overdueLoansText);
    }
    
    return stats;
  }

  /**
   * Extract number from text
   * @param {string} text - Text containing number
   * @returns {number} Extracted number
   */
  extractNumber(text) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get recent loans
   * @returns {Promise<Array>} Array of recent loan information
   */
  async getRecentLoans() {
    if (await this.isVisible(this.recentLoansSection)) {
      await this.waitForSelector(this.recentLoanItems);
      const loanCount = await this.countElements(this.recentLoanItems);
      const loans = [];
      
      for (let i = 0; i < loanCount; i++) {
        const loanItem = this.page.locator(this.recentLoanItems).nth(i);
        const text = await loanItem.textContent();
        loans.push(text?.trim());
      }
      
      return loans;
    }
    
    return [];
  }

  /**
   * Get popular books
   * @returns {Promise<Array>} Array of popular book information
   */
  async getPopularBooks() {
    if (await this.isVisible(this.popularBooksSection)) {
      await this.waitForSelector(this.popularBookItems);
      const bookCount = await this.countElements(this.popularBookItems);
      const books = [];
      
      for (let i = 0; i < bookCount; i++) {
        const bookItem = this.page.locator(this.popularBookItems).nth(i);
        const text = await bookItem.textContent();
        books.push(text?.trim());
      }
      
      return books;
    }
    
    return [];
  }

  /**
   * Click view all loans button
   */
  async clickViewAllLoans() {
    await this.clickElement(this.viewAllLoansButton);
    await this.page.waitForURL('/librarian/loans');
  }

  /**
   * Click manage books button
   */
  async clickManageBooks() {
    await this.clickElement(this.manageBooksButton);
    await this.page.waitForURL('/librarian/books');
  }

  /**
   * Click add book button
   */
  async clickAddBook() {
    if (await this.isVisible(this.addBookButton)) {
      await this.clickElement(this.addBookButton);
      // This might open a modal or navigate to add book page
    }
  }

  /**
   * Refresh dashboard data
   */
  async refreshDashboard() {
    if (await this.isVisible(this.refreshButton)) {
      const responsePromise = this.waitForApiResponse('/api/dashboard');
      await this.clickElement(this.refreshButton);
      await responsePromise;
      await this.waitForDashboardToLoad();
    }
  }

  /**
   * Verify dashboard elements are visible
   */
  async verifyDashboardElements() {
    await expect(this.page.locator(this.pageTitle)).toBeVisible();
    await expect(this.page.locator(this.statsCards).first()).toBeVisible();
  }

  /**
   * Verify statistics cards are displayed
   */
  async verifyStatsCards() {
    await expect(this.page.locator(this.totalBooksCard)).toBeVisible();
    await expect(this.page.locator(this.availableBooksCard)).toBeVisible();
    await expect(this.page.locator(this.borrowedBooksCard)).toBeVisible();
    await expect(this.page.locator(this.totalMembersCard)).toBeVisible();
  }

  /**
   * Verify quick actions are available
   */
  async verifyQuickActions() {
    if (await this.isVisible(this.quickActionsSection)) {
      await expect(this.page.locator(this.viewAllLoansButton)).toBeVisible();
      await expect(this.page.locator(this.manageBooksButton)).toBeVisible();
    }
  }

  /**
   * Verify recent loans section
   */
  async verifyRecentLoansSection() {
    if (await this.isVisible(this.recentLoansSection)) {
      await expect(this.page.locator(this.recentLoansSection)).toBeVisible();
    }
  }

  /**
   * Verify popular books section
   */
  async verifyPopularBooksSection() {
    if (await this.isVisible(this.popularBooksSection)) {
      await expect(this.page.locator(this.popularBooksSection)).toBeVisible();
    }
  }

  /**
   * Verify statistics are realistic
   * @param {Object} expectedRanges - Expected ranges for statistics
   */
  async verifyStatsRanges(expectedRanges) {
    const stats = await this.getDashboardStats();
    
    if (expectedRanges.totalBooks) {
      expect(stats.totalBooks).toBeGreaterThanOrEqual(expectedRanges.totalBooks.min);
      expect(stats.totalBooks).toBeLessThanOrEqual(expectedRanges.totalBooks.max);
    }
    
    if (expectedRanges.totalMembers) {
      expect(stats.totalMembers).toBeGreaterThanOrEqual(expectedRanges.totalMembers.min);
      expect(stats.totalMembers).toBeLessThanOrEqual(expectedRanges.totalMembers.max);
    }
    
    // Available + Borrowed should equal Total
    if (stats.totalBooks && stats.availableBooks && stats.borrowedBooks) {
      expect(stats.availableBooks + stats.borrowedBooks).toBeLessThanOrEqual(stats.totalBooks);
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
   * Check if charts are displayed
   * @returns {Promise<boolean>} True if charts are visible
   */
  async areChartsDisplayed() {
    return await this.isVisible(this.chartContainer);
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    await this.navigate();
    await this.checkAccessibility();
  }

  /**
   * Wait for specific stat to update
   * @param {string} statType - Type of stat to wait for
   * @param {number} expectedValue - Expected value
   */
  async waitForStatUpdate(statType, expectedValue) {
    const selector = this.getStatSelector(statType);
    
    await this.page.waitForFunction(
      ({ selector, expectedValue }) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        
        const text = element.textContent;
        const match = text.match(/\d+/);
        const currentValue = match ? parseInt(match[0], 10) : 0;
        
        return currentValue === expectedValue;
      },
      { selector, expectedValue },
      { timeout: TIMEOUTS.MEDIUM }
    );
  }

  /**
   * Get selector for specific stat type
   * @param {string} statType - Type of stat
   * @returns {string} Selector
   */
  getStatSelector(statType) {
    const selectorMap = {
      totalBooks: this.totalBooksCard,
      availableBooks: this.availableBooksCard,
      borrowedBooks: this.borrowedBooksCard,
      totalMembers: this.totalMembersCard,
      activeLoans: this.activeLoansCard,
      overdueLoans: this.overdueLoansCard
    };
    
    return selectorMap[statType] || this.statsCards;
  }

  /**
   * Verify dashboard responsiveness
   */
  async verifyResponsiveness() {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.verifyDashboardElements();
    
    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.verifyDashboardElements();
    
    // Restore desktop view
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.verifyDashboardElements();
  }

  /**
   * Get dashboard loading time
   * @returns {Promise<number>} Loading time in milliseconds
   */
  async getDashboardLoadingTime() {
    const startTime = Date.now();
    await this.navigate();
    await this.waitForDashboardToLoad();
    const endTime = Date.now();
    
    return endTime - startTime;
  }
}