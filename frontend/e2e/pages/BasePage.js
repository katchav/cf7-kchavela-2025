import { expect } from '@playwright/test';

/**
 * Base page class that provides common functionality for all page objects
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   * @param {string} path - The path to navigate to
   */
  async goto(path = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - Element selector
   * @param {number} timeout - Optional timeout in milliseconds
   */
  async waitForSelector(selector, timeout = 30000) {
    await this.page.waitForSelector(selector, { 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Click element with wait
   * @param {string} selector - Element selector
   */
  async clickElement(selector) {
    await this.waitForSelector(selector);
    await this.page.click(selector);
  }

  /**
   * Fill input field
   * @param {string} selector - Input selector
   * @param {string} value - Value to fill
   */
  async fillInput(selector, value) {
    await this.waitForSelector(selector);
    await this.page.fill(selector, value);
  }

  /**
   * Get text content of element
   * @param {string} selector - Element selector
   * @returns {Promise<string>} Text content
   */
  async getTextContent(selector) {
    await this.waitForSelector(selector);
    return await this.page.textContent(selector);
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>} True if visible
   */
  async isVisible(selector) {
    try {
      await this.page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for API response
   * @param {string} urlPattern - URL pattern to match
   * @param {Object} options - Additional options
   */
  async waitForApiResponse(urlPattern, options = {}) {
    const response = await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === (options.status || 200),
      { timeout: options.timeout || 30000 }
    );
    return response;
  }

  /**
   * Take screenshot
   * @param {string} name - Screenshot name
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Check for accessibility violations
   */
  async checkAccessibility() {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright');
    await injectAxe(this.page);
    await checkA11y(this.page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  }

  /**
   * Wait for navigation to complete
   * @param {Function} action - Action that triggers navigation
   */
  async waitForNavigation(action) {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      action()
    ]);
  }

  /**
   * Scroll element into view
   * @param {string} selector - Element selector
   */
  async scrollToElement(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for text to appear
   * @param {string} text - Text to wait for
   * @param {number} timeout - Optional timeout
   */
  async waitForText(text, timeout = 30000) {
    await this.page.waitForSelector(`text="${text}"`, { timeout });
  }

  /**
   * Verify current URL contains path
   * @param {string} path - Expected path
   */
  async verifyUrl(path) {
    await expect(this.page).toHaveURL(new RegExp(`.*${path}.*`));
  }

  /**
   * Get all text contents from elements matching selector
   * @param {string} selector - Element selector
   * @returns {Promise<string[]>} Array of text contents
   */
  async getAllTextContents(selector) {
    await this.waitForSelector(selector);
    return await this.page.locator(selector).allTextContents();
  }

  /**
   * Count elements matching selector
   * @param {string} selector - Element selector
   * @returns {Promise<number>} Element count
   */
  async countElements(selector) {
    return await this.page.locator(selector).count();
  }

  /**
   * Select option from dropdown
   * @param {string} selector - Select element selector
   * @param {string} value - Option value to select
   */
  async selectOption(selector, value) {
    await this.waitForSelector(selector);
    await this.page.selectOption(selector, value);
  }

  /**
   * Clear input field
   * @param {string} selector - Input selector
   */
  async clearInput(selector) {
    await this.waitForSelector(selector);
    await this.page.fill(selector, '');
  }

  /**
   * Press key
   * @param {string} key - Key to press
   */
  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  /**
   * Hover over element
   * @param {string} selector - Element selector
   */
  async hover(selector) {
    await this.waitForSelector(selector);
    await this.page.hover(selector);
  }
}