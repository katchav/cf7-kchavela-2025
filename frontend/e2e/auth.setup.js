import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { TEST_USERS } from './utils/test-data.js';

const memberAuthFile = 'e2e/.auth/member.json';
const librarianAuthFile = 'e2e/.auth/librarian.json';

/**
 * Setup authentication for member user
 */
setup('authenticate as member', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  // Login as member
  await loginPage.navigate();
  await loginPage.fillLoginForm(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
  
  const response = await loginPage.submitForm();
  expect(response.status()).toBe(200);
  
  // Wait for successful login
  await loginPage.waitForLoginSuccess();
  
  // Verify we're on the home page and authenticated
  await expect(page).toHaveURL('/');
  
  // Check for authenticated state indicators
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  await expect(logoutButton).toBeVisible({ timeout: 10000 });
  
  // Save signed-in state to 'memberAuthFile'
  await page.context().storageState({ path: memberAuthFile });
});

/**
 * Setup authentication for librarian user
 */
setup('authenticate as librarian', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  // Login as librarian
  await loginPage.navigate();
  await loginPage.fillLoginForm(TEST_USERS.LIBRARIAN.email, TEST_USERS.LIBRARIAN.password);
  
  const response = await loginPage.submitForm();
  expect(response.status()).toBe(200);
  
  // Wait for successful login
  await loginPage.waitForLoginSuccess();
  
  // Verify we're on the home page and authenticated
  await expect(page).toHaveURL('/');
  
  // Check for authenticated state indicators
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  await expect(logoutButton).toBeVisible({ timeout: 10000 });
  
  // Verify librarian-specific elements are present
  const librarianDashboard = page.locator('a[href="/librarian/dashboard"]');
  await expect(librarianDashboard).toBeVisible({ timeout: 10000 });
  
  // Save signed-in state to 'librarianAuthFile'
  await page.context().storageState({ path: librarianAuthFile });
});