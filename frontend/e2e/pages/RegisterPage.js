import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { TIMEOUTS } from '../utils/test-data.js';

/**
 * Page Object for Register page
 */
export class RegisterPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.firstNameInput = 'input[name="firstName"]';
    this.lastNameInput = 'input[name="lastName"]';
    this.emailInput = 'input[name="email"]';
    this.passwordInput = 'input[name="password"]';
    this.submitButton = 'button[type="submit"]';
    this.loginLink = 'a[href="/login"]';
    this.errorMessage = '.bg-red-50';
    this.successMessage = '.bg-green-50';
    this.loadingState = 'button:has-text("Registering...")';
    this.pageTitle = 'h2:has-text("Create your account")';
  }

  /**
   * Navigate to register page
   */
  async navigate() {
    await this.goto('/register');
    await this.waitForSelector(this.pageTitle);
  }

  /**
   * Fill registration form
   * @param {Object} userData - User registration data
   */
  async fillRegistrationForm(userData) {
    await this.fillInput(this.firstNameInput, userData.firstName);
    await this.fillInput(this.lastNameInput, userData.lastName);
    await this.fillInput(this.emailInput, userData.email);
    await this.fillInput(this.passwordInput, userData.password);
  }

  /**
   * Submit registration form
   */
  async submitForm() {
    const responsePromise = this.waitForApiResponse('/api/auth/register');
    await this.clickElement(this.submitButton);
    return await responsePromise;
  }

  /**
   * Perform complete registration flow
   * @param {Object} userData - User registration data
   */
  async register(userData) {
    await this.navigate();
    await this.fillRegistrationForm(userData);
    const response = await this.submitForm();
    
    return response;
  }

  /**
   * Verify registration page elements are visible
   */
  async verifyPageElements() {
    await expect(this.page.locator(this.pageTitle)).toBeVisible();
    await expect(this.page.locator(this.firstNameInput)).toBeVisible();
    await expect(this.page.locator(this.lastNameInput)).toBeVisible();
    await expect(this.page.locator(this.emailInput)).toBeVisible();
    await expect(this.page.locator(this.passwordInput)).toBeVisible();
    await expect(this.page.locator(this.submitButton)).toBeVisible();
    await expect(this.page.locator(this.loginLink)).toBeVisible();
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
   * Verify success message is displayed
   * @param {string} expectedMessage - Expected success message
   */
  async verifySuccessMessage(expectedMessage) {
    const successElement = this.page.locator(this.successMessage);
    await expect(successElement).toBeVisible();
    await expect(successElement).toContainText(expectedMessage);
  }

  /**
   * Verify loading state is shown
   */
  async verifyLoadingState() {
    await expect(this.page.locator(this.loadingState)).toBeVisible();
  }

  /**
   * Click login link
   */
  async clickLoginLink() {
    await this.clickElement(this.loginLink);
    await this.page.waitForURL('/login');
  }

  /**
   * Test registration with existing email
   * @param {Object} userData - User data with existing email
   */
  async attemptDuplicateEmailRegistration(userData) {
    await this.navigate();
    await this.fillRegistrationForm(userData);
    
    const responsePromise = this.waitForApiResponse('/api/auth/register', { status: 400 });
    await this.clickElement(this.submitButton);
    
    const response = await responsePromise;
    return response;
  }

  /**
   * Clear registration form
   */
  async clearForm() {
    await this.clearInput(this.firstNameInput);
    await this.clearInput(this.lastNameInput);
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
    const firstNameValid = await this.page.locator(this.firstNameInput).evaluate(el => el.validity.valid);
    const lastNameValid = await this.page.locator(this.lastNameInput).evaluate(el => el.validity.valid);
    const emailValid = await this.page.locator(this.emailInput).evaluate(el => el.validity.valid);
    const passwordValid = await this.page.locator(this.passwordInput).evaluate(el => el.validity.valid);
    
    expect(firstNameValid).toBe(false);
    expect(lastNameValid).toBe(false);
    expect(emailValid).toBe(false);
    expect(passwordValid).toBe(false);
  }

  /**
   * Test password validation
   * @param {string} weakPassword - Weak password to test
   */
  async testPasswordValidation(weakPassword) {
    await this.navigate();
    await this.fillInput(this.firstNameInput, 'Test');
    await this.fillInput(this.lastNameInput, 'User');
    await this.fillInput(this.emailInput, 'test@example.com');
    await this.fillInput(this.passwordInput, weakPassword);
    
    const responsePromise = this.waitForApiResponse('/api/auth/register', { status: 400 });
    await this.clickElement(this.submitButton);
    
    const response = await responsePromise;
    return response;
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
    const firstName = await this.page.locator(this.firstNameInput).inputValue();
    const lastName = await this.page.locator(this.lastNameInput).inputValue();
    const email = await this.page.locator(this.emailInput).inputValue();
    const password = await this.page.locator(this.passwordInput).inputValue();
    
    return { firstName, lastName, email, password };
  }

  /**
   * Check if submit button is disabled
   * @returns {boolean} True if disabled
   */
  async isSubmitButtonDisabled() {
    return await this.page.locator(this.submitButton).isDisabled();
  }

  /**
   * Verify successful registration redirect
   */
  async waitForRegistrationSuccess() {
    // Typically redirects to login page after successful registration
    await this.page.waitForURL('/login', { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Verify page title and meta
   */
  async verifyPageMeta() {
    await expect(this.page).toHaveTitle(/Register|Sign up|Create account/i);
  }

  /**
   * Test email format validation
   * @param {string} invalidEmail - Invalid email format
   */
  async testEmailValidation(invalidEmail) {
    await this.navigate();
    await this.fillInput(this.firstNameInput, 'Test');
    await this.fillInput(this.lastNameInput, 'User');
    await this.fillInput(this.emailInput, invalidEmail);
    await this.fillInput(this.passwordInput, 'ValidPass123!');
    
    await this.clickElement(this.submitButton);
    
    // Check HTML5 email validation
    const emailValid = await this.page.locator(this.emailInput).evaluate(el => el.validity.valid);
    expect(emailValid).toBe(false);
  }

  /**
   * Check field placeholders and labels
   */
  async verifyFieldLabels() {
    await this.navigate();
    
    // Verify input labels or placeholders exist
    const firstNamePlaceholder = await this.page.locator(this.firstNameInput).getAttribute('placeholder');
    const lastNamePlaceholder = await this.page.locator(this.lastNameInput).getAttribute('placeholder');
    const emailPlaceholder = await this.page.locator(this.emailInput).getAttribute('placeholder');
    const passwordPlaceholder = await this.page.locator(this.passwordInput).getAttribute('placeholder');
    
    expect(firstNamePlaceholder).toBeTruthy();
    expect(lastNamePlaceholder).toBeTruthy();
    expect(emailPlaceholder).toBeTruthy();
    expect(passwordPlaceholder).toBeTruthy();
  }
}