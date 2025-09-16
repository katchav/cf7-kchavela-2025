const { body, param, query } = require('express-validator');

/**
 * Validation rules for book endpoints
 */

const createBookValidation = [
  body('isbn')
    .notEmpty()
    .withMessage('ISBN is required')
    .matches(/^(?:ISBN(?:-1[03])?:?\s)?(?=[0-9X]{10}$|(?=(?:[0-9]+[-\s]){3})[-\s0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[-\s]){4})[-\s0-9]{17}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]$/)
    .withMessage('Invalid ISBN format'),
    
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
    
  body('author')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Author must be between 1 and 300 characters'),
    
  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Publisher must be less than 200 characters'),
    
  body('publication_year')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Publication year must be a valid year'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
    
  body('cover_image_url')
    .optional()
    .isURL()
    .withMessage('Cover image URL must be a valid URL'),
    
  body('total_copies')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total copies must be between 1 and 1000'),
    
  body('available_copies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be non-negative')
    .custom((value, { req }) => {
      const totalCopies = req.body.total_copies || 1;
      if (value > totalCopies) {
        throw new Error('Available copies cannot exceed total copies');
      }
      return true;
    }),
    
  body('category_ids')
    .optional()
    .isArray()
    .withMessage('Category IDs must be an array')
    .custom((value) => {
      if (value.some(id => typeof id !== 'string' || id.length === 0)) {
        throw new Error('All category IDs must be non-empty strings');
      }
      return true;
    })
];

const updateBookValidation = [
  param('id')
    .isUUID()
    .withMessage('Book ID must be a valid UUID'),
    
  body('isbn')
    .optional()
    .matches(/^(?:ISBN(?:-1[03])?:?\s)?(?=[0-9X]{10}$|(?=(?:[0-9]+[-\s]){3})[-\s0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[-\s]){4})[-\s0-9]{17}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]$/)
    .withMessage('Invalid ISBN format'),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
    
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Author must be between 1 and 300 characters'),
    
  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Publisher must be less than 200 characters'),
    
  body('publication_year')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Publication year must be a valid year'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
    
  body('cover_image_url')
    .optional()
    .isURL()
    .withMessage('Cover image URL must be a valid URL'),
    
  body('total_copies')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total copies must be between 1 and 1000'),
    
  body('available_copies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be non-negative'),
    
  body('category_ids')
    .optional()
    .isArray()
    .withMessage('Category IDs must be an array')
    .custom((value) => {
      if (value.some(id => typeof id !== 'string' || id.length === 0)) {
        throw new Error('All category IDs must be non-empty strings');
      }
      return true;
    })
];

const bookIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Book ID must be a valid UUID')
];

const categoryIdValidation = [
  param('categoryId')
    .isUUID()
    .withMessage('Category ID must be a valid UUID')
];

const searchBooksValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search term must be between 1 and 200 characters'),
    
  query('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Author filter must be between 1 and 300 characters'),
    
  query('publisher')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Publisher filter must be between 1 and 200 characters'),
    
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category filter must be between 1 and 100 characters'),
    
  query('year_from')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Year from must be a valid year'),
    
  query('year_to')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Year to must be a valid year'),
    
  query('available_only')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('Available only must be a boolean'),
    
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
    .isIn(['title', 'author', 'publisher', 'publication_year', 'created_at', 'available_copies'])
    .withMessage('Sort by must be one of: title, author, publisher, publication_year, created_at, available_copies'),
    
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('available_only')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('Available only must be a boolean')
];

const popularBooksValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('period_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period days must be between 1 and 365')
];

const recentBooksValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  query('available_only')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('Available only must be a boolean')
];

module.exports = {
  createBookValidation,
  updateBookValidation,
  bookIdValidation,
  categoryIdValidation,
  searchBooksValidation,
  paginationValidation,
  popularBooksValidation,
  recentBooksValidation
};