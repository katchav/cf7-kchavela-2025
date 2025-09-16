import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../utils/test-data.js';

/**
 * Page Object for All Loans (Librarian) page
 */
export class AllLoansPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.pageTitle = 'h1:has-text("All Loans"), h1:has-text("Manage Loans")';
    this.loanTable = '[data-testid="loans-table"], .loans-table';
    this.loanRows = '[data-testid="loan-row"], .loan-row, tbody tr';
    this.borrowerColumn = '[data-testid="borrower-name"], .borrower-name';
    this.bookTitleColumn = '[data-testid="book-title"], .book-title';
    this.borrowDateColumn = '[data-testid="borrow-date"], .borrow-date';
    this.dueDateColumn = '[data-testid="due-date"], .due-date';
    this.statusColumn = '[data-testid="loan-status"], .loan-status';
    this.actionsColumn = '[data-testid="loan-actions"], .loan-actions';
    this.processReturnButtons = 'button:has-text("Process Return"), [data-testid="process-return"]';
    this.extendLoanButtons = 'button:has-text("Extend"), [data-testid="extend-loan"]';
    this.viewDetailsButtons = 'button:has-text("View Details"), [data-testid="view-details"]';
    this.searchInput = 'input[placeholder*="Search"], input[name="search"]';
    this.statusFilter = 'select[name="status"], [data-testid="status-filter"]';
    this.overdueFilter = 'select[name="overdue"], [data-testid="overdue-filter"]';
    this.sortSelect = 'select[name="sort"], [data-testid="sort-select"]';
    this.loadingSpinner = '[data-testid="loading-spinner"], .loading';
    this.noLoansMessage = '[data-testid="no-loans"], .no-loans';
    this.successMessage = '.bg-green-50, [data-testid="success-message"]';
    this.errorMessage = '.bg-red-50, [data-testid="error-message"]';
    this.confirmModal = '[data-testid="confirm-modal"], .confirm-modal';
    this.confirmButton = 'button:has-text("Confirm"), [data-testid="confirm-button"]';
    this.cancelButton = 'button:has-text("Cancel"), [data-testid="cancel-button"]';
    this.paginationContainer = '[data-testid="pagination"], .pagination';
    this.nextPageButton = 'button:has-text("Next"), [data-testid="next-page"]';
    this.prevPageButton = 'button:has-text("Previous"), [data-testid="prev-page"]';
    this.overdueLoans = '[data-testid="overdue-loan"], .overdue-loan, .text-red-600';
    this.exportButton = 'button:has-text("Export"), [data-testid="export-button"]';
  }

  /**
   * Navigate to all loans page
   */
  async navigate() {
    await this.goto('/librarian/loans');
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
   * Get all loan data
   * @returns {Promise<Array>} Array of loan information
   */
  async getAllLoans() {
    await this.waitForLoansToLoad();
    
    try {
      await this.waitForSelector(this.loanRows, 5000);
      const loanCount = await this.countElements(this.loanRows);
      const loans = [];
      
      for (let i = 0; i < loanCount; i++) {
        const row = this.page.locator(this.loanRows).nth(i);
        
        const borrower = await this.getColumnText(row, this.borrowerColumn);
        const bookTitle = await this.getColumnText(row, this.bookTitleColumn);
        const borrowDate = await this.getColumnText(row, this.borrowDateColumn);
        const dueDate = await this.getColumnText(row, this.dueDateColumn);
        const status = await this.getColumnText(row, this.statusColumn);
        
        loans.push({
          borrower: borrower?.trim(),
          bookTitle: bookTitle?.trim(),
          borrowDate: borrowDate?.trim(),
          dueDate: dueDate?.trim(),
          status: status?.trim(),
          index: i
        });
      }
      
      return loans;
    } catch {
      return [];
    }
  }

  /**
   * Get text from specific column in a row
   * @param {Locator} row - Row locator
   * @param {string} columnSelector - Column selector
   * @returns {Promise<string>} Column text
   */
  async getColumnText(row, columnSelector) {
    try {
      const column = row.locator(columnSelector);
      if (await column.isVisible()) {
        return await column.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Process return for a specific loan
   * @param {string} borrowerName - Name of borrower
   * @param {string} bookTitle - Title of book
   */
  async processReturnByBorrowerAndBook(borrowerName, bookTitle) {
    const row = this.page.locator(this.loanRows).filter({
      hasText: borrowerName
    }).filter({
      hasText: bookTitle
    });
    
    const returnButton = row.locator(this.processReturnButtons);
    
    const responsePromise = this.waitForApiResponse('/api/loans/', { 
      method: 'PUT' 
    });
    
    await returnButton.click();
    
    // Handle confirmation modal if present
    if (await this.isVisible(this.confirmModal)) {
      await this.clickElement(this.confirmButton);
    }
    
    const response = await responsePromise;
    await this.waitForLoadingToComplete();
    
    return response;
  }

  /**
   * Process return by row index
   * @param {number} index - Row index
   */
  async processReturnByIndex(index) {
    await this.waitForSelector(this.loanRows);
    const row = this.page.locator(this.loanRows).nth(index);
    const returnButton = row.locator(this.processReturnButtons);
    
    const responsePromise = this.waitForApiResponse('/api/loans/', { 
      method: 'PUT' 
    });
    
    await returnButton.click();
    
    // Handle confirmation modal if present
    if (await this.isVisible(this.confirmModal)) {
      await this.clickElement(this.confirmButton);
    }
    
    const response = await responsePromise;
    await this.waitForLoadingToComplete();
    
    return response;
  }

  /**
   * Extend loan duration
   * @param {string} borrowerName - Name of borrower
   * @param {string} bookTitle - Title of book
   */
  async extendLoan(borrowerName, bookTitle) {
    const row = this.page.locator(this.loanRows).filter({
      hasText: borrowerName
    }).filter({
      hasText: bookTitle
    });
    
    const extendButton = row.locator(this.extendLoanButtons);
    
    if (await extendButton.isVisible()) {
      const responsePromise = this.waitForApiResponse('/api/loans/', { 
        method: 'PUT' 
      });
      
      await extendButton.click();
      
      // Handle confirmation modal if present
      if (await this.isVisible(this.confirmModal)) {
        await this.clickElement(this.confirmButton);
      }
      
      const response = await responsePromise;
      await this.waitForLoadingToComplete();
      
      return response;
    }
    
    throw new Error('Extend button not available for this loan');
  }

  /**
   * View loan details
   * @param {string} borrowerName - Name of borrower
   * @param {string} bookTitle - Title of book
   */
  async viewLoanDetails(borrowerName, bookTitle) {
    const row = this.page.locator(this.loanRows).filter({
      hasText: borrowerName
    }).filter({
      hasText: bookTitle
    });
    
    const detailsButton = row.locator(this.viewDetailsButtons);
    
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      // This might open a modal or navigate to details page
    }
  }

  /**
   * Search loans
   * @param {string} searchTerm - Search term
   */
  async searchLoans(searchTerm) {
    await this.fillInput(this.searchInput, searchTerm);
    
    const responsePromise = this.waitForApiResponse('/api/loans');
    await this.pressKey('Enter');
    await responsePromise;
    
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter by loan status
   * @param {string} status - Loan status
   */
  async filterByStatus(status) {
    if (await this.isVisible(this.statusFilter)) {
      const responsePromise = this.waitForApiResponse('/api/loans');
      await this.selectOption(this.statusFilter, status);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Filter by overdue status
   * @param {string} overdueStatus - Overdue filter option
   */
  async filterByOverdue(overdueStatus) {
    if (await this.isVisible(this.overdueFilter)) {
      const responsePromise = this.waitForApiResponse('/api/loans');
      await this.selectOption(this.overdueFilter, overdueStatus);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Sort loans
   * @param {string} sortOption - Sort option
   */
  async sortLoans(sortOption) {
    if (await this.isVisible(this.sortSelect)) {
      const responsePromise = this.waitForApiResponse('/api/loans');
      await this.selectOption(this.sortSelect, sortOption);
      await responsePromise;
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Get number of loans displayed
   * @returns {Promise<number>} Number of loan rows
   */
  async getLoanCount() {
    try {
      await this.waitForSelector(this.loanRows, 5000);
      return await this.countElements(this.loanRows);
    } catch {
      return 0;
    }
  }

  /**
   * Get overdue loans
   * @returns {Promise<Array>} Array of overdue loan information
   */
  async getOverdueLoans() {
    const overdueRows = this.page.locator(this.loanRows).filter({
      has: this.page.locator(this.overdueLoans)
    });
    
    const count = await overdueRows.count();
    const overdueLoans = [];
    
    for (let i = 0; i < count; i++) {
      const row = overdueRows.nth(i);
      const borrower = await this.getColumnText(row, this.borrowerColumn);
      const bookTitle = await this.getColumnText(row, this.bookTitleColumn);
      const dueDate = await this.getColumnText(row, this.dueDateColumn);
      
      overdueLoans.push({
        borrower: borrower?.trim(),
        bookTitle: bookTitle?.trim(),
        dueDate: dueDate?.trim()
      });
    }
    
    return overdueLoans;
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    if (await this.isVisible(this.nextPageButton)) {
      const isDisabled = await this.page.locator(this.nextPageButton).isDisabled();
      if (!isDisabled) {
        const responsePromise = this.waitForApiResponse('/api/loans');
        await this.clickElement(this.nextPageButton);
        await responsePromise;
        await this.waitForLoadingToComplete();
      }
    }
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    if (await this.isVisible(this.prevPageButton)) {
      const isDisabled = await this.page.locator(this.prevPageButton).isDisabled();
      if (!isDisabled) {
        const responsePromise = this.waitForApiResponse('/api/loans');
        await this.clickElement(this.prevPageButton);
        await responsePromise;
        await this.waitForLoadingToComplete();
      }
    }
  }

  /**
   * Export loans data
   */
  async exportLoans() {
    if (await this.isVisible(this.exportButton)) {
      const downloadPromise = this.page.waitForEvent('download');
      await this.clickElement(this.exportButton);
      const download = await downloadPromise;
      return download;
    }
  }

  /**
   * Verify page elements are visible
   */
  async verifyPageElements() {
    await expect(this.page.locator(this.pageTitle)).toBeVisible();
    await expect(this.page.locator(this.searchInput)).toBeVisible();
  }

  /**
   * Verify loans table is displayed
   */
  async verifyLoansTable() {
    await expect(this.page.locator(this.loanTable)).toBeVisible();
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
    await expect(this.page.locator(this.loanRows).first()).toBeVisible();
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
   * Verify specific loan is displayed
   * @param {string} borrowerName - Borrower name
   * @param {string} bookTitle - Book title
   */
  async verifyLoanDisplayed(borrowerName, bookTitle) {
    const row = this.page.locator(this.loanRows).filter({
      hasText: borrowerName
    }).filter({
      hasText: bookTitle
    });
    
    await expect(row).toBeVisible();
  }

  /**
   * Check if loan can be returned
   * @param {string} borrowerName - Borrower name
   * @param {string} bookTitle - Book title
   * @returns {Promise<boolean>} True if can be returned
   */
  async canReturnLoan(borrowerName, bookTitle) {
    const row = this.page.locator(this.loanRows).filter({
      hasText: borrowerName
    }).filter({
      hasText: bookTitle
    });
    
    const returnButton = row.locator(this.processReturnButtons);
    return await returnButton.isVisible() && !(await returnButton.isDisabled());
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    await this.navigate();
    await this.checkAccessibility();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clearInput(this.searchInput);
    
    if (await this.isVisible(this.statusFilter)) {
      await this.selectOption(this.statusFilter, '');
    }
    
    if (await this.isVisible(this.overdueFilter)) {
      await this.selectOption(this.overdueFilter, '');
    }
    
    const responsePromise = this.waitForApiResponse('/api/loans');
    await this.pressKey('Enter');
    await responsePromise;
    
    await this.waitForLoadingToComplete();
  }

  /**
   * Get loan statistics
   * @returns {Promise<Object>} Loan statistics
   */
  async getLoanStatistics() {
    await this.waitForLoansToLoad();
    
    const totalLoans = await this.getLoanCount();
    const overdueLoans = await this.getOverdueLoans();
    const overdueCount = overdueLoans.length;
    
    return {
      total: totalLoans,
      overdue: overdueCount,
      onTime: totalLoans - overdueCount
    };
  }
}