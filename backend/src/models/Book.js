// Book model
class Book {
  constructor(data) {
    this.id = data.id;
    this.isbn = data.isbn;
    this.title = data.title;
    this.author = data.author;
    this.publisher = data.publisher;
    this.publication_year = data.publication_year;
    this.description = data.description;
    this.cover_image_url = data.cover_image_url;
    this.total_copies = data.total_copies || 1;
    this.available_copies = data.available_copies || 1;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Extra fields from database joins
    this.categories = data.categories || [];
    this.is_available = data.is_available !== undefined ? data.is_available : this.available_copies > 0;
    this.borrowed_copies = data.borrowed_copies !== undefined ? data.borrowed_copies : (this.total_copies - this.available_copies);
  }

  // Check if we can borrow this book
  isAvailable() {
    return this.available_copies > 0;
  }

  // Get borrowing stats
  getBorrowingStats() {
    return {
      total_copies: this.total_copies,
      available_copies: this.available_copies,
      borrowed_copies: this.total_copies - this.available_copies,
      availability_percentage: (this.available_copies / this.total_copies) * 100
    };
  }

  // Get cover image URL (use Open Library if we don't have one)
  getCoverImageUrl() {
    if (this.cover_image_url) {
      return this.cover_image_url;
    }
    
    // Try to get cover from Open Library using ISBN
    if (this.isbn) {
      const cleanIsbn = this.isbn.replace(/[-\s]/g, '');
      return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
    }
    
    // Default placeholder image
    return 'https://via.placeholder.com/200x300/cccccc/000000?text=No+Cover';
  }

  /**
   * Get short description (truncated)
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated description
   */
  getShortDescription(maxLength = 200) {
    if (!this.description) return '';
    
    if (this.description.length <= maxLength) {
      return this.description;
    }
    
    return this.description.substring(0, maxLength).trim() + '...';
  }

  /**
   * Get book data for API responses
   * @param {boolean} includeStats - Include borrowing statistics
   * @returns {Object} Book data
   */
  toJSON(includeStats = false) {
    const bookData = {
      id: this.id,
      isbn: this.isbn,
      title: this.title,
      author: this.author,
      publisher: this.publisher,
      publication_year: this.publication_year,
      description: this.description,
      cover_image_url: this.getCoverImageUrl(),
      is_available: this.isAvailable(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };

    if (includeStats) {
      bookData.stats = this.getBorrowingStats();
    } else {
      bookData.available_copies = this.available_copies;
      bookData.total_copies = this.total_copies;
    }

    if (this.categories && this.categories.length > 0) {
      bookData.categories = this.categories;
    }

    return bookData;
  }

  /**
   * Get minimal book data for lists
   * @returns {Object} Minimal book data
   */
  toSummary() {
    return {
      id: this.id,
      isbn: this.isbn,
      title: this.title,
      author: this.author,
      cover_image_url: this.getCoverImageUrl(),
      is_available: this.isAvailable(),
      available_copies: this.available_copies,
      publication_year: this.publication_year
    };
  }

  /**
   * Get search-optimized representation
   * @returns {Object} Search data
   */
  toSearchResult() {
    return {
      id: this.id,
      isbn: this.isbn,
      title: this.title,
      author: this.author,
      publisher: this.publisher,
      publication_year: this.publication_year,
      short_description: this.getShortDescription(150),
      cover_image_url: this.getCoverImageUrl(),
      is_available: this.isAvailable(),
      available_copies: this.available_copies,
      total_copies: this.total_copies,
      categories: this.categories
    };
  }
}

module.exports = Book;