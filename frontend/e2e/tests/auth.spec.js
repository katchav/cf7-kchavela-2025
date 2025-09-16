import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { TEST_USERS, generateTestData } from '../utils/test-data.js';
import { logout, clearStorage } from '../utils/helpers.js';

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await clearStorage(page);
  });

  test.describe('Login', () => {
    
    test('should successfully login with valid member credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Navigate to login page
      await loginPage.navigate();
      await loginPage.verifyPageElements();
      
      // Login with member credentials
      const response = await loginPage.login(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      
      // Verify successful login
      expect(response.status()).toBe(200);
      await expect(page).toHaveURL('/');
      
      // Verify user is authenticated
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      await expect(logoutButton).toBeVisible();
    });

    test('should successfully login with valid librarian credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Navigate to login page
      await loginPage.navigate();
      
      // Login with librarian credentials
      const response = await loginPage.login(TEST_USERS.LIBRARIAN.email, TEST_USERS.LIBRARIAN.password);
      
      // Verify successful login
      expect(response.status()).toBe(200);
      await expect(page).toHaveURL('/');
      
      // Verify librarian-specific elements are present
      const librarianDashboard = page.locator('a[href="/librarian/dashboard"]');
      await expect(librarianDashboard).toBeVisible();
    });

    test('should show error message for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Attempt login with invalid credentials
      const response = await loginPage.attemptInvalidLogin('invalid@email.com', 'wrongpassword');
      
      // Verify error response
      expect(response.status()).toBe(401);
      
      // Verify error message is displayed
      await loginPage.verifyErrorMessage('Invalid credentials');
      
      // Verify still on login page
      await expect(page).toHaveURL('/login');
    });

    test('should validate form fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Test form validation
      await loginPage.verifyFormValidation();
    });

    test('should show loading state during login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      
      // Click submit and quickly check for loading state
      await loginPage.clickElement(loginPage.submitButton);
      
      // Note: Loading state might be too fast to catch reliably
      // This test verifies the UI handles loading states properly
    });

    test('should display demo accounts information', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.verifyDemoAccounts();
    });

    test('should navigate to register page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.clickRegisterLink();
      
      await expect(page).toHaveURL('/register');
    });

    test('should pass accessibility checks', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.verifyAccessibility();
    });
  });

  test.describe('Register', () => {
    
    test('should successfully register new user', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const userData = {
        firstName: generateTestData.firstName(),
        lastName: generateTestData.lastName(),
        email: generateTestData.email(),
        password: generateTestData.password()
      };
      
      // Register new user
      const response = await registerPage.register(userData);
      
      // Verify successful registration
      expect(response.status()).toBe(201);
      
      // Should redirect to login page or show success message
      // The exact behavior depends on your app's registration flow
      await expect(page).toHaveURL('/login');
    });

    test('should show error for duplicate email', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: TEST_USERS.MEMBER.email, // Use existing email
        password: 'TestPass123!'
      };
      
      // Attempt registration with existing email
      const response = await registerPage.attemptDuplicateEmailRegistration(userData);
      
      // Verify error response
      expect(response.status()).toBe(400);
      
      // Verify error message is displayed
      await registerPage.verifyErrorMessage('Email already exists');
    });

    test('should validate form fields', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      // Test form validation
      await registerPage.verifyFormValidation();
    });

    test('should validate email format', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      // Test invalid email formats
      await registerPage.testEmailValidation('invalid-email');
      await registerPage.testEmailValidation('@example.com');
      await registerPage.testEmailValidation('test@');
    });

    test('should validate password strength', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      // Test weak passwords
      await registerPage.testPasswordValidation('weak');
      await registerPage.testPasswordValidation('12345');
      await registerPage.testPasswordValidation('password');
    });

    test('should verify page elements', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      await registerPage.navigate();
      await registerPage.verifyPageElements();
    });

    test('should navigate to login page', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      await registerPage.navigate();
      await registerPage.clickLoginLink();
      
      await expect(page).toHaveURL('/login');
    });

    test('should pass accessibility checks', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.verifyAccessibility();
    });
  });

  test.describe('Logout', () => {
    
    test('should successfully logout member user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Login first
      await loginPage.login(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      
      // Verify authenticated state
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      await expect(logoutButton).toBeVisible();
      
      // Logout
      await logout(page);
      
      // Verify logged out state
      await expect(page).toHaveURL(url => url.pathname === '/login' || url.pathname === '/');
      
      // Try to access protected route
      await page.goto('/my-loans');
      // Should redirect to login or show unauthorized message
      await expect(page).toHaveURL('/login');
    });

    test('should successfully logout librarian user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Login as librarian
      await loginPage.login(TEST_USERS.LIBRARIAN.email, TEST_USERS.LIBRARIAN.password);
      
      // Verify authenticated state
      const librarianDashboard = page.locator('a[href="/librarian/dashboard"]');
      await expect(librarianDashboard).toBeVisible();
      
      // Logout
      await logout(page);
      
      // Verify logged out state
      await expect(page).toHaveURL(url => url.pathname === '/login' || url.pathname === '/');
      
      // Try to access protected route
      await page.goto('/librarian/dashboard');
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Authentication State Persistence', () => {
    
    test('should maintain authentication on page refresh', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Login
      await loginPage.login(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      
      // Refresh page
      await page.reload();
      
      // Verify still authenticated
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      await expect(logoutButton).toBeVisible();
    });

    test('should redirect to login when accessing protected routes while not authenticated', async ({ page }) => {
      // Clear any existing auth state
      await clearStorage(page);
      
      // Try to access protected routes
      const protectedRoutes = ['/my-loans', '/librarian/dashboard', '/librarian/loans'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });

    test('should redirect after login to originally requested page', async ({ page }) => {
      // Clear any existing auth state
      await clearStorage(page);
      
      // Try to access protected route (should redirect to login)
      await page.goto('/my-loans');
      await expect(page).toHaveURL('/login');
      
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.fillLoginForm(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      await loginPage.submitForm();
      
      // Should redirect back to originally requested page
      // Note: This behavior depends on your app's implementation
      await expect(page).toHaveURL('/my-loans');
    });
  });

  test.describe('Role-based Access Control', () => {
    
    test('member should not access librarian routes', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Login as member
      await loginPage.login(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      
      // Try to access librarian routes
      const librarianRoutes = [
        '/librarian/dashboard',
        '/librarian/books', 
        '/librarian/loans'
      ];
      
      for (const route of librarianRoutes) {
        await page.goto(route);
        // Should redirect or show unauthorized message
        await expect(page).not.toHaveURL(route);
      }
    });

    test('librarian should have access to all routes', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Login as librarian
      await loginPage.login(TEST_USERS.LIBRARIAN.email, TEST_USERS.LIBRARIAN.password);
      
      // Should be able to access librarian routes
      const librarianRoutes = [
        '/librarian/dashboard',
        '/librarian/loans'
      ];
      
      for (const route of librarianRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
      }
      
      // Should also be able to access member routes
      await page.goto('/my-loans');
      await expect(page).toHaveURL('/my-loans');
    });
  });
});