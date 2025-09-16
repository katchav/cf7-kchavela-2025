/**
 * Test data and constants used across tests
 */

export const TEST_USERS = {
  LIBRARIAN: {
    email: 'librarian@library.com',
    password: 'LibPass123!',
    role: 'librarian'
  },
  MEMBER: {
    email: 'member@library.com',
    password: 'MemPass123!',
    role: 'member'
  },
  NEW_MEMBER: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    password: 'TestPass123!',
    role: 'member'
  }
};

export const TEST_BOOKS = {
  SAMPLE_BOOK: {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    category: 'Fiction'
  },
  SEARCH_BOOK: {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    category: 'Fiction'
  }
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout'
  },
  BOOKS: {
    LIST: '/api/books',
    DETAIL: '/api/books/:id',
    SEARCH: '/api/books/search'
  },
  LOANS: {
    LIST: '/api/loans',
    CREATE: '/api/loans',
    RETURN: '/api/loans/:id/return',
    MY_LOANS: '/api/loans/my-loans'
  }
};

export const SELECTORS = {
  NAVIGATION: {
    HOME_LINK: 'a[href="/"]',
    BOOKS_LINK: 'a[href="/books"]',
    MY_LOANS_LINK: 'a[href="/my-loans"]',
    LIBRARIAN_DASHBOARD: 'a[href="/librarian/dashboard"]',
    LOGOUT_BUTTON: 'button:has-text("Logout")'
  },
  FORMS: {
    EMAIL_INPUT: 'input[name="email"]',
    PASSWORD_INPUT: 'input[name="password"]',
    FIRST_NAME_INPUT: 'input[name="firstName"]',
    LAST_NAME_INPUT: 'input[name="lastName"]',
    SUBMIT_BUTTON: 'button[type="submit"]'
  },
  BOOKS: {
    BOOK_CARD: '[data-testid="book-card"]',
    BOOK_TITLE: '[data-testid="book-title"]',
    BOOK_AUTHOR: '[data-testid="book-author"]',
    BORROW_BUTTON: 'button:has-text("Borrow")',
    RETURN_BUTTON: 'button:has-text("Return")',
    SEARCH_INPUT: 'input[placeholder*="Search"]',
    SEARCH_BUTTON: 'button:has-text("Search")'
  },
  ALERTS: {
    SUCCESS_MESSAGE: '.bg-green-50',
    ERROR_MESSAGE: '.bg-red-50',
    INFO_MESSAGE: '.bg-blue-50'
  }
};

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  API_RESPONSE: 10000
};

export const URLS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BOOKS: '/books',
  MY_LOANS: '/my-loans',
  LIBRARIAN: {
    DASHBOARD: '/librarian/dashboard',
    BOOKS: '/librarian/books',
    LOANS: '/librarian/loans'
  }
};

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  BOOK_NOT_AVAILABLE: 'Book is not available',
  UNAUTHORIZED: 'Unauthorized',
  NETWORK_ERROR: 'Network error'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'Registration successful',
  BOOK_BORROWED: 'Book borrowed successfully',
  BOOK_RETURNED: 'Book returned successfully'  
};

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test.${Date.now()}@example.com`,
  password: () => 'TestPass123!',
  firstName: () => 'Test',
  lastName: () => `User${Date.now()}`,
  bookTitle: () => `Test Book ${Date.now()}`,
  isbn: () => `978${Math.random().toString().substring(2, 12)}`
};