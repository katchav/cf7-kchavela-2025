const categoryRepository = require('../repositories/CategoryRepository');
const config = require('../config/app');
const logger = require('../utils/logger');

/**
 * Category service for business logic operations
 */
class CategoryService {
  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Category>} Created category
   */
  async createCategory(categoryData) {
    const { name, description } = categoryData;

    // Check if category already exists
    const existingCategory = await categoryRepository.findByName(name);
    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    if (name.trim().length > 100) {
      throw new Error('Category name must be less than 100 characters');
    }

    // Create the category
    const category = await categoryRepository.create({
      name: name.trim(),
      description: description ? description.trim() : null
    });

    logger.info('Category created successfully', {
      categoryId: category.id,
      name: category.name
    });

    return category;
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Category|null>} Updated category or null
   */
  async updateCategory(categoryId, updates) {
    // Check if category exists
    const existingCategory = await categoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Validate name uniqueness if name is being updated
    if (updates.name && updates.name !== existingCategory.name) {
      const duplicateCategory = await categoryRepository.findByName(updates.name);
      if (duplicateCategory) {
        throw new Error('Category with this name already exists');
      }
    }

    // Validate updates
    const validatedUpdates = {};

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Category name cannot be empty');
      }
      if (updates.name.trim().length > 100) {
        throw new Error('Category name must be less than 100 characters');
      }
      validatedUpdates.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      if (updates.description && updates.description.trim().length > 500) {
        throw new Error('Category description must be less than 500 characters');
      }
      validatedUpdates.description = updates.description ? updates.description.trim() : null;
    }

    // Update the category
    const updatedCategory = await categoryRepository.update(categoryId, validatedUpdates);

    logger.info('Category updated successfully', {
      categoryId: categoryId,
      updates: Object.keys(validatedUpdates)
    });

    return updatedCategory;
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteCategory(categoryId) {
    // Check if category exists
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has associated books
    const hasBooks = await categoryRepository.hasBooks(categoryId);
    if (hasBooks) {
      throw new Error('Cannot delete category that has associated books');
    }

    const deleted = await categoryRepository.delete(categoryId);
    
    if (deleted) {
      logger.info('Category deleted successfully', {
        categoryId: categoryId,
        name: category.name
      });
    }

    return deleted;
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @param {boolean} includeBookCount - Include book count
   * @returns {Promise<Category|null>} Category or null if not found
   */
  async getCategoryById(categoryId, includeBookCount = false) {
    return await categoryRepository.findById(categoryId, includeBookCount);
  }

  /**
   * Get all categories with pagination and search
   * @param {Object} options - Query options
   * @returns {Promise<{categories: Category[], total: number, page: number, pages: number}>} Categories with pagination
   */
  async getCategories(options = {}) {
    const {
      includeBookCount = false,
      search = null,
      page = 1,
      limit = config.pagination.defaultLimit
    } = options;

    // Validate pagination
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(
      Math.max(1, parseInt(limit) || config.pagination.defaultLimit),
      100 // Max limit for categories
    );
    const offset = (validatedPage - 1) * validatedLimit;

    const result = await categoryRepository.findAll({
      includeBookCount,
      limit: validatedLimit,
      offset,
      search
    });

    return {
      categories: result.categories,
      total: result.total,
      page: validatedPage,
      pages: Math.ceil(result.total / validatedLimit),
      limit: validatedLimit
    };
  }

  /**
   * Get categories with book counts
   * @returns {Promise<Category[]>} Categories with book counts
   */
  async getCategoriesWithBookCount() {
    return await categoryRepository.getCategoriesWithBookCount();
  }

  /**
   * Get popular categories
   * @param {Object} options - Query options
   * @returns {Promise<Category[]>} Popular categories
   */
  async getPopularCategories(options = {}) {
    const { limit = 10 } = options;
    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 10), 50);

    return await categoryRepository.getPopularCategories(validatedLimit);
  }

  /**
   * Get category options for dropdowns
   * @returns {Promise<Array>} Category options
   */
  async getCategoryOptions() {
    return await categoryRepository.getCategoryOptions();
  }

  /**
   * Get category statistics
   * @returns {Promise<Object>} Category statistics
   */
  async getStatistics() {
    return await categoryRepository.getStatistics();
  }

  /**
   * Search categories by name or description
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<{categories: Category[], total: number}>} Search results
   */
  async searchCategories(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    if (searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }

    const {
      includeBookCount = false,
      limit = 20
    } = options;

    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100);

    const result = await categoryRepository.findAll({
      includeBookCount,
      limit: validatedLimit,
      offset: 0,
      search: searchTerm.trim()
    });

    return {
      categories: result.categories,
      total: result.total,
      searchTerm: searchTerm.trim()
    };
  }

  /**
   * Validate category name
   * @param {string} name - Category name
   * @returns {boolean} True if valid
   */
  validateCategoryName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const trimmedName = name.trim();
    return trimmedName.length > 0 && trimmedName.length <= 100;
  }

  /**
   * Validate category description
   * @param {string} description - Category description
   * @returns {boolean} True if valid
   */
  validateCategoryDescription(description) {
    if (!description) {
      return true; // Description is optional
    }

    if (typeof description !== 'string') {
      return false;
    }

    return description.trim().length <= 500;
  }
}

module.exports = new CategoryService();