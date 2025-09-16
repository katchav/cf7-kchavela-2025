import { expect } from '@playwright/test';
import { TEST_USERS, TIMEOUTS } from './test-data.js';

/**
 * Helper functions for common test operations
 */

/**
 * Login with credentials
 * @param {Page} page - Playwright page object
 * @param {Object} credentials - User credentials
 */
export async function login(page, credentials = TEST_USERS.MEMBER) {
  await page.goto('/login');
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  
  // Wait for login response
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/auth/login')
  );
  
  await page.click('button[type="submit"]');
  
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  
  // Wait for redirect to home page
  await page.waitForURL('/');
}

/**
 * Logout user
 * @param {Page} page - Playwright page object
 */
export async function logout(page) {
  // Look for logout button/link in navigation
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  await logoutButton.click();
  
  // Wait for redirect to login page or home page
  await page.waitForURL(url => url.pathname === '/login' || url.pathname === '/');
}

/**
 * Register new user
 * @param {Page} page - Playwright page object
 * @param {Object} userData - User registration data
 */
export async function register(page, userData) {
  await page.goto('/register');
  await page.fill('input[name="firstName"]', userData.firstName);
  await page.fill('input[name="lastName"]', userData.lastName);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/auth/register')
  );
  
  await page.click('button[type="submit"]');
  
  const response = await responsePromise;
  return response;
}

/**
 * Wait for API call to complete
 * @param {Page} page - Playwright page object
 * @param {string} endpoint - API endpoint to wait for
 * @param {number} expectedStatus - Expected HTTP status code
 */
export async function waitForApiCall(page, endpoint, expectedStatus = 200) {
  const response = await page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === expectedStatus,
    { timeout: TIMEOUTS.API_RESPONSE }
  );
  return response;
}

/**
 * Search for books
 * @param {Page} page - Playwright page object
 * @param {string} searchTerm - Search term
 */
export async function searchBooks(page, searchTerm) {
  await page.goto('/books');
  await page.fill('input[placeholder*="Search"]', searchTerm);
  
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/books')
  );
  
  await page.click('button:has-text("Search")');
  await responsePromise;
  
  // Wait for results to load
  await page.waitForLoadState('networkidle');
}

/**
 * Borrow a book
 * @param {Page} page - Playwright page object
 * @param {string} bookId - Book ID to borrow
 */
export async function borrowBook(page, bookId) {
  await page.goto(`/books/${bookId}`);
  
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/loans') && response.request().method() === 'POST'
  );
  
  await page.click('button:has-text("Borrow")');
  
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  
  return response;
}

/**
 * Return a book
 * @param {Page} page - Playwright page object
 * @param {string} loanId - Loan ID to return
 */
export async function returnBook(page, loanId) {
  const responsePromise = page.waitForResponse(
    response => response.url().includes(`/api/loans/${loanId}/return`) && response.request().method() === 'PUT'
  );
  
  await page.click(`button[data-loan-id="${loanId}"]:has-text("Return")`);
  
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  
  return response;
}

/**
 * Wait for element to contain text
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {string} text - Expected text
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForElementText(page, selector, text, timeout = TIMEOUTS.MEDIUM) {
  await page.waitForFunction(
    ({ selector, text }) => {
      const element = document.querySelector(selector);
      return element && element.textContent.includes(text);
    },
    { selector, text },
    { timeout }
  );
}

/**
 * Check if user is authenticated
 * @param {Page} page - Playwright page object
 * @returns {boolean} True if authenticated
 */
export async function isAuthenticated(page) {
  try {
    // Check for presence of authenticated user elements
    await page.waitForSelector('button:has-text("Logout"), a:has-text("My Loans")', { 
      timeout: 5000 
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current user role
 * @param {Page} page - Playwright page object
 * @returns {string|null} User role or null if not authenticated
 */
export async function getCurrentUserRole(page) {
  try {
    // Check for librarian-specific elements
    await page.waitForSelector('a[href="/librarian/dashboard"]', { timeout: 2000 });
    return 'librarian';
  } catch {
    // Check if authenticated as member
    if (await isAuthenticated(page)) {
      return 'member';
    }
    return null;
  }
}

/**
 * Clear browser storage
 * @param {Page} page - Playwright page object
 */
export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Mock API response
 * @param {Page} page - Playwright page object
 * @param {string} endpoint - API endpoint to mock
 * @param {Object} mockData - Mock response data
 * @param {number} status - HTTP status code
 */
export async function mockApiResponse(page, endpoint, mockData, status = 200) {
  await page.route(`**${endpoint}`, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(mockData),
    });
  });
}

/**
 * Wait for loading spinner to disappear
 * @param {Page} page - Playwright page object
 */
export async function waitForLoadingToComplete(page) {
  try {
    // Wait for loading spinner to appear
    await page.waitForSelector('[data-testid="loading-spinner"], .loading', { 
      timeout: 2000 
    });
    // Then wait for it to disappear
    await page.waitForSelector('[data-testid="loading-spinner"], .loading', { 
      state: 'hidden', 
      timeout: TIMEOUTS.LONG 
    });
  } catch {
    // Loading spinner might not appear for fast operations
  }
}

/**
 * Take full page screenshot with timestamp
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
export async function takeTimestampedScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Verify error message is displayed
 * @param {Page} page - Playwright page object
 * @param {string} expectedMessage - Expected error message
 */
export async function verifyErrorMessage(page, expectedMessage) {
  const errorElement = page.locator('.bg-red-50, .error, [role="alert"]').first();
  await expect(errorElement).toBeVisible();
  await expect(errorElement).toContainText(expectedMessage);
}

/**
 * Verify success message is displayed
 * @param {Page} page - Playwright page object
 * @param {string} expectedMessage - Expected success message
 */
export async function verifySuccessMessage(page, expectedMessage) {
  const successElement = page.locator('.bg-green-50, .success, [role="alert"]').first();
  await expect(successElement).toBeVisible();
  await expect(successElement).toContainText(expectedMessage);
}