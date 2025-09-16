import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../utils/test-data.js';

/**
 * Page Object for Book List page
 */
export class BookListPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.searchInput = 'input[placeholder*="Search"], input[name="search"]';
    this.searchButton = 'button:has-text("Search"), button[type="submit"]';
    this.bookCards = '[data-testid="book-card"], .book-card';
    this.bookTitles = '[data-testid="book-title"], .book-title';
    this.bookAuthors = '[data-testid="book-author"], .book-author';
    this.bookAvailability = '[data-testid="book-availability"], .book-availability';
    this.categoryFilter = 'select[name="category"], [data-testid="category-filter"]';
    this.availabilityFilter = 'select[name="availability"], [data-testid="availability-filter"]';
    this.sortSelect = 'select[name="sort"], [data-testid="sort-select"]';
    this.loadingSpinner = '[data-testid="loading-spinner"], .loading';
    this.noResultsMessage = '[data-testid="no-results"], .no-results';
    this.paginationNext = 'button:has-text("Next"), [data-testid="next-page"]';
    this.paginationPrev = 'button:has-text("Previous"), [data-testid="prev-page"]';
    this.pageTitle = 'h1:has-text("Books"), h1:has-text("Book Library")';
  }

  /**
   * Navigate to book list page
   */
  async navigate() {
    await this.goto('/books');
    await this.waitForSelector(this.pageTitle);
  }

  /**
   * Search for books
   * @param {string} searchTerm - Search term
   */
  async searchBooks(searchTerm) {
    await this.fillInput(this.searchInput, searchTerm);
    
    const responsePromise = this.waitForApiResponse('/api/books');
    await this.clickElement(this.searchButton);
    await responsePromise;
    
    // Wait for results to load
    await this.waitForLoadingToComplete();
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete() {
    try {
      // Wait for loading spinner to appear
      await this.page.waitForSelector(this.loadingSpinner, { timeout: 2000 });
      // Then wait for it to disappear
      await this.page.waitForSelector(this.loadingSpinner, { 
        state: 'hidden', 
        timeout: TIMEOUTS.LONG 
      });
    } catch {
      // Loading spinner might not appear for fast operations
    }
  }

  /**
   * Get all book titles on current page
   * @returns {Promise<string[]>} Array of book titles
   */
  async getBookTitles() {
    await this.waitForSelector(this.bookCards);
    return await this.getAllTextContents(this.bookTitles);
  }

  /**
   * Get all book authors on current page
   * @returns {Promise<string[]>} Array of book authors
   */
  async getBookAuthors() {
    await this.waitForSelector(this.bookCards);
    return await this.getAllTextContents(this.bookAuthors);
  }

  /**
   * Get number of books displayed
   * @returns {Promise<number>} Number of book cards
   */
  async getBookCount() {
    try {
      await this.waitForSelector(this.bookCards, 5000);
      return await this.countElements(this.bookCards);
    } catch {
      return 0;
    }
  }

  /**
   * Click on a specific book by title
   * @param {string} bookTitle - Title of book to click
   */
  async clickBookByTitle(bookTitle) {
    const bookCard = this.page.locator(this.bookCards).filter({ 
      hasText: bookTitle 
    });
    
    await bookCard.click();
    
    // Wait for navigation to book detail page
    await this.page.waitForURL(/\/books\/\d+/);
  }

  /**
   * Click on first book in list
   */
  async clickFirstBook() {
    await this.waitForSelector(this.bookCards);
    const firstBook = this.page.locator(this.bookCards).first();
    await firstBook.click();
    
    // Wait for navigation to book detail page
    await this.page.waitForURL(/\/books\/\d+/);
  }

  /**
   * Filter books by category
   * @param {string} category - Category to filter by
   */
  async filterByCategory(category) {
    if (await this.isVisible(this.categoryFilter)) {
      const responsePromise = this.waitForApiResponse('/api/books');
      await this.selectOption(this.categoryFilter, category);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Filter books by availability
   * @param {string} availability - Availability status
   */
  async filterByAvailability(availability) {
    if (await this.isVisible(this.availabilityFilter)) {
      const responsePromise = this.waitForApiResponse('/api/books');
      await this.selectOption(this.availabilityFilter, availability);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Sort books
   * @param {string} sortOption - Sort option
   */
  async sortBooks(sortOption) {
    if (await this.isVisible(this.sortSelect)) {
      const responsePromise = this.waitForApiResponse('/api/books');
      await this.selectOption(this.sortSelect, sortOption);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    if (await this.isVisible(this.paginationNext)) {
      const isDisabled = await this.page.locator(this.paginationNext).isDisabled();
      if (!isDisabled) {
        const responsePromise = this.waitForApiResponse('/api/books');
        await this.clickElement(this.paginationNext);
        await responsePromise;
        await this.waitForLoadingToComplete();
      }
    }
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    if (await this.isVisible(this.paginationPrev)) {
      const isDisabled = await this.page.locator(this.paginationPrev).isDisabled();
      if (!isDisabled) {
        const responsePromise = this.waitForApiResponse('/api/books');
        await this.clickElement(this.paginationPrev);
        await responsePromise;
        await this.waitForLoadingToComplete();
      }
    }
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.clearInput(this.searchInput);
    const responsePromise = this.waitForApiResponse('/api/books');
    await this.clickElement(this.searchButton);
    await responsePromise;
    await this.waitForLoadingToComplete();
  }

  /**
   * Verify page elements are visible
   */
  async verifyPageElements() {
    await expect(this.page.locator(this.pageTitle)).toBeVisible();
    await expect(this.page.locator(this.searchInput)).toBeVisible();
    await expect(this.page.locator(this.searchButton)).toBeVisible();
  }

  /**
   * Verify no results message is shown
   */
  async verifyNoResults() {
    await expect(this.page.locator(this.noResultsMessage)).toBeVisible();
  }

  /**
   * Verify books are displayed
   */
  async verifyBooksDisplayed() {
    await expect(this.page.locator(this.bookCards).first()).toBeVisible();
  }

  /**
   * Verify specific book is displayed
   * @param {string} bookTitle - Title to verify
   */
  async verifyBookDisplayed(bookTitle) {
    const bookCard = this.page.locator(this.bookCards).filter({ 
      hasText: bookTitle 
    });
    await expect(bookCard).toBeVisible();
  }

  /**
   * Verify search results contain term
   * @param {string} searchTerm - Search term to verify
   */
  async verifySearchResults(searchTerm) {
    const titles = await this.getBookTitles();
    const authors = await this.getBookAuthors();
    
    const matchFound = titles.some(title => 
      title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || authors.some(author => 
      author.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    expect(matchFound).toBe(true);
  }

  /**
   * Get book availability status
   * @param {string} bookTitle - Book title
   * @returns {Promise<string>} Availability status
   */
  async getBookAvailability(bookTitle) {
    const bookCard = this.page.locator(this.bookCards).filter({ 
      hasText: bookTitle 
    });
    
    const availabilityElement = bookCard.locator(this.bookAvailability);
    return await availabilityElement.textContent();
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    await this.navigate();
    await this.checkAccessibility();
  }

  /**
   * Get current page URL parameters
   * @returns {Object} URL search parameters
   */
  async getUrlParams() {
    const url = new URL(this.page.url());
    const params = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Verify book card contains required information
   * @param {string} bookTitle - Book title to check
   */
  async verifyBookCardInfo(bookTitle) {
    const bookCard = this.page.locator(this.bookCards).filter({ 
      hasText: bookTitle 
    });
    
    await expect(bookCard.locator(this.bookTitles)).toContainText(bookTitle);
    await expect(bookCard.locator(this.bookAuthors)).toBeVisible();
    await expect(bookCard.locator(this.bookAvailability)).toBeVisible();
  }

  /**
   * Wait for books to load after page navigation
   */
  async waitForBooksToLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.waitForLoadingToComplete();
  }
}