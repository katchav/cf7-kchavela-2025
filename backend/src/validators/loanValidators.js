const { body, param, query } = require('express-validator');

/**
 * Validation rules for loan endpoints
 */

const borrowBookValidation = [
  body('book_id')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
    
  body('loan_period_days')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Loan period must be between 1 and 60 days'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const returnBookValidation = [
  param('id')
    .isUUID()
    .withMessage('Loan ID must be a valid UUID'),
    
  body('return_date')
    .optional()
    .isISO8601()
    .withMessage('Return date must be a valid ISO 8601 date')
    .custom((value) => {
      const returnDate = new Date(value);
      const now = new Date();
      if (returnDate > now) {
        throw new Error('Return date cannot be in the future');
      }
      return true;
    }),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const renewLoanValidation = [
  param('id')
    .isUUID()
    .withMessage('Loan ID must be a valid UUID'),
    
  body('extension_days')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Extension days must be between 1 and 30 days'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const loanIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Loan ID must be a valid UUID')
];

const userIdValidation = [
  param('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

const getUserLoansValidation = [
  query('status')
    .optional()
    .isIn(['active', 'returned', 'overdue'])
    .withMessage('Status must be one of: active, returned, overdue'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const getAllLoansValidation = [
  query('status')
    .optional()
    .isIn(['active', 'returned', 'overdue'])
    .withMessage('Status must be one of: active, returned, overdue'),
    
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
    
  query('book_id')
    .optional()
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
    
  query('overdue_only')
    .optional()
    .isBoolean()
    .withMessage('Overdue only must be a boolean'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort_by')
    .optional()
    .isIn(['loan_date', 'due_date', 'return_date', 'status', 'created_at'])
    .withMessage('Sort by must be one of: loan_date, due_date, return_date, status, created_at'),
    
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC')
];

const overdueLoansValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const forceReturnValidation = [
  param('id')
    .isUUID()
    .withMessage('Loan ID must be a valid UUID'),
    
  body('return_date')
    .optional()
    .isISO8601()
    .withMessage('Return date must be a valid ISO 8601 date')
    .custom((value) => {
      const returnDate = new Date(value);
      const now = new Date();
      if (returnDate > now) {
        throw new Error('Return date cannot be in the future');
      }
      return true;
    }),
    
  body('notes')
    .notEmpty()
    .withMessage('Notes are required for force returns')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Notes must be between 10 and 500 characters for force returns')
];

const mostBorrowedBooksValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('period_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period days must be between 1 and 365')
];

const borrowingEligibilityValidation = [
  param('userId')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

module.exports = {
  borrowBookValidation,
  returnBookValidation,
  renewLoanValidation,
  loanIdValidation,
  userIdValidation,
  getUserLoansValidation,
  getAllLoansValidation,
  overdueLoansValidation,
  forceReturnValidation,
  mostBorrowedBooksValidation,
  borrowingEligibilityValidation
};