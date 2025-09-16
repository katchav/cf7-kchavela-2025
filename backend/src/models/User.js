/**
 * User model representing a library member or librarian
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role;
    this.max_books_allowed = data.max_books_allowed || 10;
    this.refresh_token = data.refresh_token;
    this.reset_token = data.reset_token;
    this.reset_token_expires = data.reset_token_expires;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get user's full name
   * @returns {string} Full name
   */
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  /**
   * Check if user is a librarian
   * @returns {boolean} True if librarian
   */
  isLibrarian() {
    return this.role === 'librarian';
  }

  /**
   * Check if user is a member
   * @returns {boolean} True if member
   */
  isMember() {
    return this.role === 'member';
  }

  /**
   * Get user data for API responses (excluding sensitive information)
   * @returns {Object} Safe user data
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      fullName: this.fullName,
      role: this.role,
      max_books_allowed: this.max_books_allowed,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Get minimal user data for token payloads
   * @returns {Object} Minimal user data
   */
  toTokenPayload() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      first_name: this.first_name,
      last_name: this.last_name
    };
  }
}

module.exports = User;