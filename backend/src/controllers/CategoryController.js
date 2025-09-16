const { validationResult } = require('express-validator');
const categoryService = require('../services/CategoryService');
const logger = require('../utils/logger');

/**
 * Category controller handling category-related HTTP requests
 */
class CategoryController {
  /**
   * Get all categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getCategories(req, res, next) {
    try {
      const options = {
        includeBookCount: req.query.include_book_count === 'true',
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await categoryService.getCategories(options);

      res.json({
        message: 'Categories retrieved successfully',
        data: result.categories.map(category => category.toJSON(options.includeBookCount)),
        pagination: options.includeBookCount ? undefined : {
          page: result.page,
          pages: result.pages,
          limit: result.limit,
          total: result.total
        }
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      next(error);
    }
  }

  /**
   * Get category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const includeBookCount = req.query.include_book_count === 'true';

      const category = await categoryService.getCategoryById(id, includeBookCount);

      if (!category) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      res.json({
        message: 'Category retrieved successfully',
        data: category.toJSON(includeBookCount)
      });
    } catch (error) {
      logger.error('Get category by ID error:', error);
      next(error);
    }
  }

  /**
   * Create a new category (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async createCategory(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { name, description } = req.body;

      const category = await categoryService.createCategory({
        name,
        description
      });

      logger.info('Category created via API', {
        categoryId: category.id,
        createdBy: req.user.id,
        name: category.name
      });

      res.status(201).json({
        message: 'Category created successfully',
        data: category.toJSON()
      });
    } catch (error) {
      if (error.message === 'Category with this name already exists') {
        return res.status(409).json({
          error: error.message,
          code: 'CATEGORY_NAME_EXISTS'
        });
      }

      if (error.message.includes('name is required') || error.message.includes('characters')) {
        return res.status(400).json({
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      logger.error('Create category error:', error);
      next(error);
    }
  }

  /**
   * Update a category (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateCategory(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updates = {};

      // Only include provided fields in updates
      const allowedFields = ['name', 'description'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const category = await categoryService.updateCategory(id, updates);

      if (!category) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      logger.info('Category updated via API', {
        categoryId: id,
        updatedBy: req.user.id,
        fields: Object.keys(updates)
      });

      res.json({
        message: 'Category updated successfully',
        data: category.toJSON()
      });
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json({
          error: error.message,
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      if (error.message === 'Category with this name already exists') {
        return res.status(409).json({
          error: error.message,
          code: 'CATEGORY_NAME_EXISTS'
        });
      }

      if (error.message.includes('characters') || error.message.includes('empty')) {
        return res.status(400).json({
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      logger.error('Update category error:', error);
      next(error);
    }
  }

  /**
   * Delete a category (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = await categoryService.deleteCategory(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      logger.info('Category deleted via API', {
        categoryId: id,
        deletedBy: req.user.id
      });

      res.json({
        message: 'Category deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json({
          error: error.message,
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      if (error.message === 'Cannot delete category that has associated books') {
        return res.status(400).json({
          error: error.message,
          code: 'CATEGORY_HAS_BOOKS'
        });
      }

      logger.error('Delete category error:', error);
      next(error);
    }
  }

  /**
   * Get popular categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getPopularCategories(req, res, next) {
    try {
      const options = {
        limit: req.query.limit
      };

      const categories = await categoryService.getPopularCategories(options);

      res.json({
        message: 'Popular categories retrieved successfully',
        data: categories.map(category => category.toJSON(true))
      });
    } catch (error) {
      logger.error('Get popular categories error:', error);
      next(error);
    }
  }

  /**
   * Get category options for dropdowns
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getCategoryOptions(req, res, next) {
    try {
      const options = await categoryService.getCategoryOptions();

      res.json({
        message: 'Category options retrieved successfully',
        data: options
      });
    } catch (error) {
      logger.error('Get category options error:', error);
      next(error);
    }
  }

  /**
   * Get category statistics (librarian only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await categoryService.getStatistics();

      res.json({
        message: 'Category statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Get category statistics error:', error);
      next(error);
    }
  }

  /**
   * Search categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async searchCategories(req, res, next) {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          error: 'Search term is required',
          code: 'SEARCH_TERM_REQUIRED'
        });
      }

      const options = {
        includeBookCount: req.query.include_book_count === 'true',
        limit: req.query.limit
      };

      const result = await categoryService.searchCategories(searchTerm, options);

      res.json({
        message: 'Categories search completed successfully',
        data: result.categories.map(category => category.toJSON(options.includeBookCount)),
        total: result.total,
        searchTerm: result.searchTerm
      });
    } catch (error) {
      if (error.message.includes('Search term')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_SEARCH_TERM'
        });
      }

      logger.error('Search categories error:', error);
      next(error);
    }
  }
}

module.exports = new CategoryController();