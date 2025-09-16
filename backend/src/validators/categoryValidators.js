const { body, param, query } = require('express-validator');

/**
 * Validation rules for category endpoints
 */

const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&.()]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, ampersands, periods, and parentheses'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Category description must be less than 500 characters')
];

const updateCategoryValidation = [
  param('id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
    
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&.()]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, ampersands, periods, and parentheses'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Category description must be less than 500 characters')
];

const categoryIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID')
];

const getCategoriesValidation = [
  query('include_book_count')
    .optional()
    .isBoolean()
    .withMessage('Include book count must be a boolean'),
    
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
    
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const popularCategoriesValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const searchCategoriesValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search term (q) is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be between 2 and 100 characters'),
    
  query('include_book_count')
    .optional()
    .isBoolean()
    .withMessage('Include book count must be a boolean'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  getCategoriesValidation,
  popularCategoriesValidation,
  searchCategoriesValidation
};