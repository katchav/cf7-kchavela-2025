const express = require('express');
const bookController = require('../controllers/BookController');
const { authenticate, authorize } = require('../middlewares/auth');
const { browseLimiter } = require('../middlewares/security');
const {
  createBookValidation,
  updateBookValidation,
  bookIdValidation,
  categoryIdValidation,
  searchBooksValidation,
  paginationValidation,
  popularBooksValidation,
  recentBooksValidation
} = require('../validators/bookValidators');

const router = express.Router();


router.get('/', browseLimiter, searchBooksValidation, bookController.getBooks);

router.get('/popular', browseLimiter, popularBooksValidation, bookController.getPopularBooks);

router.get('/recent', browseLimiter, recentBooksValidation, bookController.getRecentBooks);

router.get('/statistics', authenticate, authorize('librarian'), bookController.getStatistics);

router.get('/category/:categoryId', browseLimiter, categoryIdValidation, paginationValidation, bookController.getBooksByCategory);

router.get('/:id', browseLimiter, bookIdValidation, bookController.getBookById);

router.get('/:id/availability', browseLimiter, bookIdValidation, bookController.checkAvailability);

router.post('/', authenticate, authorize('librarian'), createBookValidation, bookController.createBook);

router.put('/:id', authenticate, authorize('librarian'), updateBookValidation, bookController.updateBook);

router.delete('/:id', authenticate, authorize('librarian'), bookIdValidation, bookController.deleteBook);

module.exports = router;