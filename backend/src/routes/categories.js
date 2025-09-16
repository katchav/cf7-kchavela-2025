const express = require('express');
const categoryController = require('../controllers/CategoryController');
const { authenticate, authorize } = require('../middlewares/auth');
const { browseLimiter } = require('../middlewares/security');
const {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  getCategoriesValidation,
  popularCategoriesValidation,
  searchCategoriesValidation
} = require('../validators/categoryValidators');

const router = express.Router();


router.get('/', browseLimiter, getCategoriesValidation, categoryController.getCategories);

router.get('/popular', browseLimiter, popularCategoriesValidation, categoryController.getPopularCategories);

router.get('/options', browseLimiter, categoryController.getCategoryOptions);

router.get('/search', browseLimiter, searchCategoriesValidation, categoryController.searchCategories);

router.get('/statistics', authenticate, authorize('librarian'), categoryController.getStatistics);

router.get('/:id', browseLimiter, categoryIdValidation, categoryController.getCategoryById);

router.post('/', authenticate, authorize('librarian'), createCategoryValidation, categoryController.createCategory);

router.put('/:id', authenticate, authorize('librarian'), updateCategoryValidation, categoryController.updateCategory);

router.delete('/:id', authenticate, authorize('librarian'), categoryIdValidation, categoryController.deleteCategory);

module.exports = router;