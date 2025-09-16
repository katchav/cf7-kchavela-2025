/**
 * Category model for organizing books by topic/genre
 */
class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.book_count = data.book_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get category data for API responses
   * @param {boolean} includeStats - Include book count
   * @returns {Object} Category data
   */
  toJSON(includeStats = false) {
    const categoryData = {
      id: this.id,
      name: this.name,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at
    };

    if (includeStats) {
      categoryData.book_count = this.book_count;
    }

    return categoryData;
  }

  /**
   * Get minimal category data for dropdowns
   * @returns {Object} Minimal category data
   */
  toOption() {
    return {
      id: this.id,
      name: this.name,
      value: this.id,
      label: this.name
    };
  }
}

module.exports = Category;