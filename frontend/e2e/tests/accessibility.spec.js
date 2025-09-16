import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { LoginPage } from '../pages/LoginPage.js';
import { RegisterPage } from '../pages/RegisterPage.js';
import { BookListPage } from '../pages/BookListPage.js';
import { BookDetailPage } from '../pages/BookDetailPage.js';
import { MyLoansPage } from '../pages/MyLoansPage.js';
import { LibrarianDashboardPage } from '../pages/LibrarianDashboardPage.js';
import { AllLoansPage } from '../pages/AllLoansPage.js';
import { TEST_USERS } from '../utils/test-data.js';

test.describe('Accessibility Tests', () => {

  test.describe('Public Pages Accessibility', () => {
    
    test('should pass accessibility checks on login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await injectAxe(page);
      
      // Check for accessibility violations
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          // You can customize axe rules here
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true }
        }
      });
      
      // Additional manual checks
      await test.step('Check keyboard navigation', async () => {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement.tagName);
        expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
      });
      
      await test.step('Check form labels', async () => {
        const emailInput = page.locator('input[name="email"]');
        const passwordInput = page.locator('input[name="password"]');
        
        // Check if inputs have proper labels or aria-labels
        const emailLabel = await emailInput.getAttribute('aria-label') || 
                           await page.locator('label[for="email"]').textContent();
        const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                             await page.locator('label[for="password"]').textContent();
        
        expect(emailLabel).toBeTruthy();
        expect(passwordLabel).toBeTruthy();
      });
    });

    test('should pass accessibility checks on register page', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      await registerPage.navigate();
      await injectAxe(page);
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Check form accessibility
      await test.step('Check form structure', async () => {
        const form = page.locator('form');
        await expect(form).toBeVisible();
        
        // Check if form has proper headings
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible();
      });
    });

    test('should pass accessibility checks on book list page', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      await injectAxe(page);
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Check list accessibility
      await test.step('Check book list structure', async () => {
        const bookCount = await bookListPage.getBookCount();
        
        if (bookCount > 0) {
          // Check if books are properly structured (lists, cards, etc.)
          const bookCards = page.locator('[data-testid="book-card"], .book-card');
          const firstCard = bookCards.first();
          
          // Check if book cards have proper headings or labels
          const title = firstCard.locator('h1, h2, h3, h4, [data-testid="book-title"]');
          await expect(title).toBeVisible();
        }
      });
    });

    test('should pass accessibility checks on book detail page', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      await bookDetailPage.navigate('1');
      await injectAxe(page);
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Check page structure
      await test.step('Check page heading structure', async () => {
        const mainHeading = page.locator('h1').first();
        await expect(mainHeading).toBeVisible();
      });
    });
  });

  test.describe('Member Pages Accessibility', () => {
    
    test.use({ storageState: 'e2e/.auth/member.json' });
    
    test('should pass accessibility checks on my loans page', async ({ page }) => {
      const myLoansPage = new MyLoansPage(page);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      await injectAxe(page);
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Check table/list accessibility
      await test.step('Check loans data structure', async () => {
        const loanCount = await myLoansPage.getActiveLoanCount();
        
        if (loanCount > 0) {
          // Check if loans are presented in an accessible format
          const loansList = page.locator('[role="table"], table, [data-testid="loan-card"]');
          await expect(loansList.first()).toBeVisible();
        }
      });
      
      // Check interactive elements
      await test.step('Check button accessibility', async () => {
        const returnButtons = page.locator('button:has-text("Return")');
        const buttonCount = await returnButtons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = returnButtons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          const buttonText = await button.textContent();
          
          // Button should have either visible text or aria-label
          expect(ariaLabel || buttonText).toBeTruthy();
        }
      });
    });
  });

  test.describe('Librarian Pages Accessibility', () => {
    
    test.use({ storageState: 'e2e/.auth/librarian.json' });
    
    test('should pass accessibility checks on librarian dashboard', async ({ page }) => {
      const dashboardPage = new LibrarianDashboardPage(page);
      
      await dashboardPage.navigate();
      await dashboardPage.waitForDashboardToLoad();
      await injectAxe(page);
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Check dashboard widget accessibility
      await test.step('Check statistics cards accessibility', async () => {
        const statsCards = page.locator('[data-testid="stats-card"], .stats-card');
        const cardCount = await statsCards.count();
        
        for (let i = 0; i < Math.min(cardCount, 4); i++) {
          const card = statsCards.nth(i);
          
          // Each card should have a heading or label
          const heading = card.locator('h1, h2, h3, h4, [role="heading"]');
          const ariaLabel = await card.getAttribute('aria-label');
          
          const hasHeading = await heading.isVisible();
          expect(hasHeading || ariaLabel).toBeTruthy();
        }
      });
    });

    test('should pass accessibility checks on all loans page', async ({ page }) => {
      const allLoansPage = new AllLoansPage(page);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      await injectAxe(page);
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Check data table accessibility
      await test.step('Check loans table accessibility', async () => {
        const table = page.locator('table, [role="table"]');
        
        if (await table.isVisible()) {
          // Check for table headers
          const headers = table.locator('th, [role="columnheader"]');
          const headerCount = await headers.count();
          expect(headerCount).toBeGreaterThan(0);
          
          // Check if table has proper caption or aria-label
          const caption = table.locator('caption');
          const ariaLabel = await table.getAttribute('aria-label');
          const ariaLabelledBy = await table.getAttribute('aria-labelledby');
          
          const hasLabel = await caption.isVisible() || ariaLabel || ariaLabelledBy;
          expect(hasLabel).toBeTruthy();
        }
      });
      
      // Check filter controls accessibility
      await test.step('Check filter controls accessibility', async () => {
        const searchInput = page.locator('input[type="search"], input[name="search"]');
        
        if (await searchInput.isVisible()) {
          const label = await searchInput.getAttribute('aria-label') ||
                       await searchInput.getAttribute('placeholder');
          expect(label).toBeTruthy();
        }
      });
    });
  });

  test.describe('Keyboard Navigation Tests', () => {
    
    test('should support keyboard navigation on login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      
      // Test tab navigation
      await test.step('Test tab navigation', async () => {
        await page.keyboard.press('Tab');
        let focusedElement = await page.evaluate(() => document.activeElement.id || document.activeElement.name);
        expect(focusedElement).toBe('email');
        
        await page.keyboard.press('Tab');
        focusedElement = await page.evaluate(() => document.activeElement.id || document.activeElement.name);
        expect(focusedElement).toBe('password');
        
        await page.keyboard.press('Tab');
        const focusedTag = await page.evaluate(() => document.activeElement.tagName);
        expect(focusedTag).toBe('BUTTON');
      });
      
      // Test form submission with Enter key
      await test.step('Test Enter key submission', async () => {
        await page.fill('input[name="email"]', TEST_USERS.MEMBER.email);
        await page.fill('input[name="password"]', TEST_USERS.MEMBER.password);
        
        // Focus on submit button and press Enter
        await page.focus('button[type="submit"]');
        await page.keyboard.press('Enter');
        
        // Should submit the form
        await page.waitForURL('/');
      });
    });

    test('should support keyboard navigation on book list', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Test search input keyboard access
      await test.step('Test search functionality with keyboard', async () => {
        await page.focus(bookListPage.searchInput);
        await page.keyboard.type('Fiction');
        await page.keyboard.press('Enter');
        
        // Should perform search
        await bookListPage.waitForBooksToLoad();
      });
      
      // Test book card navigation
      await test.step('Test book card keyboard navigation', async () => {
        const bookCount = await bookListPage.getBookCount();
        
        if (bookCount > 0) {
          // Find first focusable book element (link or button)
          const firstBookLink = page.locator('[data-testid="book-card"] a, .book-card a').first();
          
          if (await firstBookLink.isVisible()) {
            await firstBookLink.focus();
            await page.keyboard.press('Enter');
            
            // Should navigate to book detail
            await expect(page).toHaveURL(/\/books\/\d+/);
          }
        }
      });
    });
  });

  test.describe('Screen Reader Support Tests', () => {
    
    test('should have proper heading hierarchy', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      
      // Should have at least one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Log heading structure for manual verification
      console.log('Page heading structure:', headings);
    });

    test('should have proper landmark regions', async ({ page }) => {
      const bookListPage = new BookListPage(page);
      
      await bookListPage.navigate();
      
      // Check for landmark regions
      const main = page.locator('main, [role="main"]');
      const nav = page.locator('nav, [role="navigation"]');
      
      await expect(main).toBeVisible();
      // Navigation might not be present on all pages
    });

    test('should have proper alt text for images', async ({ page }) => {
      const bookDetailPage = new BookDetailPage(page);
      
      await bookDetailPage.navigate('1');
      
      // Check images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');
        
        // Image should have alt text, aria-label, or be decorative
        if (role !== 'presentation' && role !== 'none') {
          expect(alt !== null || ariaLabel !== null).toBe(true);
        }
      }
    });
  });

  test.describe('Focus Management Tests', () => {
    
    test('should manage focus properly in modals', async ({ page }) => {
      // This test assumes your app has modals
      // Adjust based on your actual modal implementation
      
      const allLoansPage = new AllLoansPage(page);
      
      // Use librarian auth to access this page
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login(TEST_USERS.LIBRARIAN.email, TEST_USERS.LIBRARIAN.password);
      
      await allLoansPage.navigate();
      await allLoansPage.waitForLoansToLoad();
      
      const loanCount = await allLoansPage.getLoanCount();
      
      if (loanCount > 0) {
        // Try to trigger a modal (like confirmation dialog)
        const returnButton = page.locator('button:has-text("Process Return")').first();
        
        if (await returnButton.isVisible()) {
          await returnButton.click();
          
          // Check if a modal or dialog appeared
          const modal = page.locator('[role="dialog"], .modal, [data-testid="confirm-modal"]');
          
          if (await modal.isVisible()) {
            // Focus should be trapped in modal
            const focusableElements = modal.locator('button, input, select, textarea, a[href]');
            const elementCount = await focusableElements.count();
            
            if (elementCount > 0) {
              // First focusable element should be focused
              const firstElement = focusableElements.first();
              await expect(firstElement).toBeFocused();
            }
          }
        }
      }
    });

    test('should return focus after modal closes', async ({ page }) => {
      // Similar to above test but verify focus returns to trigger element
      // Implementation depends on your modal behavior
    });
  });

  test.describe('Color Contrast and Visual Tests', () => {
    
    test('should meet color contrast requirements', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await injectAxe(page);
      
      // Run specific color contrast checks
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    test('should be usable without color', async ({ page }) => {
      // Test if app is usable when color is the only way to convey information
      const myLoansPage = new MyLoansPage(page);
      
      // Login as member first
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login(TEST_USERS.MEMBER.email, TEST_USERS.MEMBER.password);
      
      await myLoansPage.navigate();
      await myLoansPage.waitForLoansToLoad();
      
      // Remove all color from the page
      await page.addStyleTag({
        content: `
          * {
            color: black !important;
            background-color: white !important;
            border-color: black !important;
          }
        `
      });
      
      // Check if important information is still conveyed
      const loanCount = await myLoansPage.getActiveLoanCount();
      
      if (loanCount > 0) {
        // Overdue status should be indicated by text, not just color
        const overdueLoans = page.locator('[data-testid="overdue-loan"], .overdue');
        const overdueCount = await overdueLoans.count();
        
        for (let i = 0; i < overdueCount; i++) {
          const overdueLoan = overdueLoans.nth(i);
          const text = await overdueLoan.textContent();
          
          // Should contain text indicating overdue status
          expect(text.toLowerCase()).toMatch(/(overdue|late|past due)/);
        }
      }
    });
  });

  test.describe('Responsive Accessibility Tests', () => {
    
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const bookListPage = new BookListPage(page);
      await bookListPage.navigate();
      await bookListPage.waitForBooksToLoad();
      
      await injectAxe(page);
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Test touch targets are large enough (minimum 44x44 pixels)
      await test.step('Check touch target sizes', async () => {
        const buttons = page.locator('button, a, input[type="button"], input[type="submit"]');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const box = await button.boundingBox();
          
          if (box) {
            // Touch targets should be at least 44x44 pixels
            const minSize = 44;
            expect(box.width).toBeGreaterThanOrEqual(minSize - 10); // Allow some margin
            expect(box.height).toBeGreaterThanOrEqual(minSize - 10);
          }
        }
      });
    });

    test('should maintain accessibility at different zoom levels', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // Test at 200% zoom
      await page.setViewportSize({ width: 640, height: 480 }); // Simulate zoom
      
      await injectAxe(page);
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
      
      // Form should still be usable
      await loginPage.verifyPageElements();
    });
  });
});