import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { SELECTORS, TIMEOUTS, ERROR_MESSAGES } from '../utils/test-data.js';

/**
 * Page Object for Login page
 */
export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.emailInput = 'input[name="email"]';
    this.passwordInput = 'input[name="password"]';
    this.submitButton = 'button[type="submit"]';
    this.registerLink = 'a[href="/register"]';
    this.errorMessage = '.bg-red-50';
    this.loadingState = 'button:has-text("Signing in...")';
    this.demoAccountsSection = '.bg-gray-50';
    this.pageTitle = 'h2:has-text("Sign in to your account")';
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/login');
    await this.waitForSelector(this.pageTitle);
  }

  /**
   * Fill login form
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async fillLoginForm(email, password) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
  }

  /**
   * Submit login form
   */
  async submitForm() {
    const responsePromise = this.waitForApiResponse('/api/auth/login');
    await this.clickElement(this.submitButton);
    return await responsePromise;
  }

  /**
   * Perform complete login flow
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    await this.navigate();
    await this.fillLoginForm(email, password);
    const response = await this.submitForm();
    
    if (response.status() === 200) {
      // Wait for redirect to home page
      await this.page.waitForURL('/');
    }
    
    return response;
  }

  /**
   * Verify login page elements are visible
   */
  async verifyPageElements() {
    await expect(this.page.locator(this.pageTitle)).toBeVisible();
    await expect(this.page.locator(this.emailInput)).toBeVisible();
    await expect(this.page.locator(this.passwordInput)).toBeVisible();
    await expect(this.page.locator(this.submitButton)).toBeVisible();
    await expect(this.page.locator(this.registerLink)).toBeVisible();
    await expect(this.page.locator(this.demoAccountsSection)).toBeVisible();
  }

  /**
   * Verify error message is displayed
   * @param {string} expectedMessage - Expected error message
   */
  async verifyErrorMessage(expectedMessage) {
    const errorElement = this.page.locator(this.errorMessage);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(expectedMessage);
  }

  /**
   * Verify loading state is shown
   */
  async verifyLoadingState() {
    await expect(this.page.locator(this.loadingState)).toBeVisible();
  }

  /**
   * Click register link
   */
  async clickRegisterLink() {
    await this.clickElement(this.registerLink);
    await this.page.waitForURL('/register');
  }

  /**
   * Verify demo accounts are shown
   */
  async verifyDemoAccounts() {
    const demoSection = this.page.locator(this.demoAccountsSection);
    await expect(demoSection).toBeVisible();
    await expect(demoSection).toContainText('librarian@library.com');
    await expect(demoSection).toContainText('member@library.com');
  }

  /**
   * Test invalid login attempt
   * @param {string} email - Invalid email
   * @param {string} password - Invalid password
   */
  async attemptInvalidLogin(email, password) {
    await this.navigate();
    await this.fillLoginForm(email, password);
    
    const responsePromise = this.waitForApiResponse('/api/auth/login', { status: 401 });
    await this.clickElement(this.submitButton);
    
    const response = await responsePromise;
    return response;
  }

  /**
   * Clear login form
   */
  async clearForm() {
    await this.clearInput(this.emailInput);
    await this.clearInput(this.passwordInput);
  }

  /**
   * Verify form validation
   */
  async verifyFormValidation() {
    await this.navigate();
    
    // Try to submit empty form
    await this.clickElement(this.submitButton);
    
    // Check HTML5 validation
    const emailValid = await this.page.locator(this.emailInput).evaluate(el => el.validity.valid);
    const passwordValid = await this.page.locator(this.passwordInput).evaluate(el => el.validity.valid);
    
    expect(emailValid).toBe(false);
    expect(passwordValid).toBe(false);
  }

  /**
   * Verify accessibility
   */
  async verifyAccessibility() {
    await this.navigate();
    await this.checkAccessibility();
  }

  /**
   * Get form field values
   * @returns {Object} Current form values
   */
  async getFormValues() {
    const email = await this.page.locator(this.emailInput).inputValue();
    const password = await this.page.locator(this.passwordInput).inputValue();
    
    return { email, password };
  }

  /**
   * Check if submit button is disabled
   * @returns {boolean} True if disabled
   */
  async isSubmitButtonDisabled() {
    return await this.page.locator(this.submitButton).isDisabled();
  }

  /**
   * Wait for successful login redirect
   */
  async waitForLoginSuccess() {
    await this.page.waitForURL('/', { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify page title and meta
   */
  async verifyPageMeta() {
    await expect(this.page).toHaveTitle(/Login|Sign in/i);
  }
}