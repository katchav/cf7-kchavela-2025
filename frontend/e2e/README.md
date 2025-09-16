# E2E Testing with Playwright

This directory contains comprehensive end-to-end tests for the Book Lending Library System using Playwright.

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Frontend server running on `http://localhost:3000`
- Backend server running on `http://localhost:5001`

### Installation

1. Install dependencies (if not already done):
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run test:e2e:install
```

## Test Structure

```
e2e/
├── pages/                    # Page Object Model classes
│   ├── BasePage.js          # Base page with common functionality
│   ├── LoginPage.js         # Login page object
│   ├── RegisterPage.js      # Registration page object
│   ├── BookListPage.js      # Book list page object
│   ├── BookDetailPage.js    # Book detail page object
│   ├── MyLoansPage.js       # Member loans page object
│   ├── LibrarianDashboardPage.js  # Librarian dashboard object
│   └── AllLoansPage.js      # All loans management object
├── tests/                   # Test specification files
│   ├── auth.spec.js         # Authentication flow tests
│   ├── books.spec.js        # Book browsing and search tests
│   ├── member-workflows.spec.js    # Member workflow tests
│   ├── librarian-workflows.spec.js # Librarian workflow tests
│   └── accessibility.spec.js       # Accessibility tests
├── utils/                   # Test utilities and helpers
│   ├── test-data.js        # Test data and constants
│   └── helpers.js          # Helper functions
├── .auth/                  # Authentication state files
├── auth.setup.js           # Authentication setup for tests
├── global-setup.js         # Global test setup
└── global-teardown.js      # Global test cleanup
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test Suites
```bash
# Authentication tests
npm run test:e2e:auth

# Book browsing and search tests
npm run test:e2e:books

# Member workflow tests
npm run test:e2e:member

# Librarian workflow tests
npm run test:e2e:librarian

# Accessibility tests
npm run test:e2e:accessibility
```

### Browser-Specific Tests
```bash
# Run on Chromium only
npm run test:e2e:chromium

# Run on Firefox only
npm run test:e2e:firefox

# Run on WebKit (Safari) only
npm run test:e2e:webkit

# Run on mobile browsers
npm run test:e2e:mobile
```

### Development and Debugging
```bash
# Run with UI (visual test runner)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### View Test Reports
```bash
npm run test:e2e:report
```

## Test Users

The tests use predefined test accounts:

- **Librarian**: `librarian@library.com` / `LibPass123!`
- **Member**: `member@library.com` / `MemPass123!`

These accounts are set up automatically during authentication setup.

## Test Categories

### 1. Authentication Tests (`auth.spec.js`)
- ✅ Login with valid credentials (member and librarian)
- ✅ Login with invalid credentials
- ✅ Registration flow
- ✅ Form validation
- ✅ Logout functionality
- ✅ Role-based access control
- ✅ Session persistence

### 2. Book Browsing Tests (`books.spec.js`)
- ✅ Display book list
- ✅ Search by title and author
- ✅ Filter by category and availability
- ✅ Sort books
- ✅ Book detail page navigation
- ✅ Pagination
- ✅ Responsive design

### 3. Member Workflow Tests (`member-workflows.spec.js`)
- ✅ Browse and search books
- ✅ Borrow available books
- ✅ View personal loans
- ✅ Return borrowed books
- ✅ Renew loans (if allowed)
- ✅ Complete member journey
- ✅ Error handling

### 4. Librarian Workflow Tests (`librarian-workflows.spec.js`)
- ✅ Dashboard statistics view
- ✅ View all loans
- ✅ Process book returns
- ✅ Extend loan durations
- ✅ Filter and search loans
- ✅ Loan analytics
- ✅ Complete librarian journey

### 5. Accessibility Tests (`accessibility.spec.js`)
- ✅ WCAG compliance checks
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ Color contrast
- ✅ Mobile accessibility
- ✅ Touch target sizes

## Page Object Model

This test suite follows the Page Object Model pattern for maintainability:

### BasePage
Common functionality shared across all pages:
- Navigation helpers
- Element interaction methods
- Waiting utilities
- Accessibility checks
- Screenshot capabilities

### Specific Page Objects
Each page has its own class with:
- Page-specific selectors
- Action methods (click, fill, etc.)
- Verification methods
- Business logic encapsulation

## Configuration

The Playwright configuration (`playwright.config.js`) includes:

- **Multiple browser testing**: Chromium, Firefox, WebKit
- **Mobile testing**: iOS Safari, Android Chrome
- **Authentication setup**: Automatic login state management
- **Parallel execution**: Optimized for CI/CD
- **Reporting**: HTML and JSON reports
- **Screenshots and videos**: On failure
- **Global setup/teardown**: Server readiness checks

## Best Practices

### 1. Test Independence
- Each test is independent and can run alone
- Tests clean up after themselves
- No shared state between tests

### 2. Reliable Selectors
- Prefer `data-testid` attributes
- Fallback to semantic selectors
- Avoid fragile CSS selectors

### 3. Waiting Strategies
- Use `waitForSelector` for element visibility
- Use `waitForResponse` for API calls
- Use `waitForLoadState` for page loads

### 4. Error Handling
- Graceful error handling in helper functions
- Meaningful error messages
- Proper cleanup on failures

### 5. Accessibility
- Regular accessibility audits using axe-core
- Keyboard navigation testing
- Screen reader compatibility

## Troubleshooting

### Common Issues

1. **Tests fail with "Server not ready"**
   - Ensure frontend is running on `http://localhost:3000`
   - Ensure backend is running on `http://localhost:5001`

2. **Authentication setup fails**
   - Check test user credentials
   - Verify login functionality works manually
   - Check network requests in browser dev tools

3. **Element not found errors**
   - Verify the application is fully loaded
   - Check if selectors match the current UI
   - Add appropriate waits before interactions

4. **Flaky tests**
   - Increase timeouts if needed
   - Add more specific waits
   - Check for race conditions

### Debug Mode

Run tests in debug mode to step through them:
```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests line by line
- Inspect the page state
- Try out selectors
- View console logs

### Screenshots and Videos

Failed tests automatically generate:
- Screenshots at the point of failure
- Videos of the entire test run
- Available in `test-results/` directory

## CI/CD Integration

The test suite is designed for CI/CD environments:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install

- name: Run E2E tests
  run: npm run test:e2e
  
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Contributing

When adding new tests:

1. Follow the existing Page Object Model structure
2. Add new page objects for new pages
3. Use descriptive test names
4. Include both happy path and error scenarios
5. Add accessibility checks for new UI components
6. Update this README if needed

## Performance Considerations

- Tests run in parallel by default
- Use `test.describe.serial()` for dependent tests
- Consider test execution time in CI/CD
- Clean up test data to avoid accumulation

## Reporting

Test reports include:
- Pass/fail status for each test
- Execution time
- Screenshots and videos for failures
- Accessibility violations
- Browser compatibility results

Access reports at: `playwright-report/index.html`