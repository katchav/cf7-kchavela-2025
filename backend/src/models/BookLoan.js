/**
 * BookLoan model representing a book borrowing transaction
 */
class BookLoan {
  constructor(data) {
    this.id = data.id;
    this.book_id = data.book_id;
    this.user_id = data.user_id;
    this.loan_date = data.loan_date;
    this.due_date = data.due_date;
    this.return_date = data.return_date;
    this.status = data.status || 'active';
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Additional fields that might be joined from queries
    this.book = data.book;
    this.user = data.user;
    this.days_overdue = data.days_overdue;
    
    // Book fields from joins
    this.book_title = data.book_title;
    this.book_author = data.book_author;
    this.book_isbn = data.book_isbn;
    this.book_cover = data.book_cover;
    
    // User fields from joins
    this.user_name = data.user_name;
    this.user_email = data.user_email;
  }

  /**
   * Check if loan is active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Check if loan is returned
   * @returns {boolean} True if returned
   */
  isReturned() {
    return this.status === 'returned';
  }

  /**
   * Check if loan is overdue
   * @returns {boolean} True if overdue
   */
  isOverdue() {
    return this.status === 'overdue' || (this.isActive() && new Date() > new Date(this.due_date));
  }

  /**
   * Get days until due (negative if overdue)
   * @returns {number} Days until due
   */
  getDaysUntilDue() {
    const now = new Date();
    const dueDate = new Date(this.due_date);
    const diffTime = dueDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get loan duration in days
   * @returns {number} Loan duration
   */
  getLoanDuration() {
    const loanDate = new Date(this.loan_date);
    const endDate = this.return_date ? new Date(this.return_date) : new Date();
    const diffTime = endDate - loanDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get loan status with additional context
   * @returns {Object} Status information
   */
  getStatusInfo() {
    const daysUntilDue = this.getDaysUntilDue();
    
    return {
      status: this.status,
      is_overdue: this.isOverdue(),
      days_until_due: daysUntilDue,
      days_overdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0,
      can_renew: this.canRenew()
    };
  }

  /**
   * Check if loan can be renewed
   * @returns {boolean} True if can be renewed
   */
  canRenew() {
    // Business rule: Can only renew if not overdue and still active
    return this.isActive() && !this.isOverdue();
  }

  /**
   * Get loan data for API responses
   * @param {boolean} includeRelations - Include book and user data
   * @returns {Object} Loan data
   */
  toJSON(includeRelations = true) {
    const loanData = {
      id: this.id,
      book_id: this.book_id,
      user_id: this.user_id,
      loan_date: this.loan_date,
      due_date: this.due_date,
      return_date: this.return_date,
      status: this.status,
      notes: this.notes,
      status_info: this.getStatusInfo(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };

    // Include book fields if they were joined in the query
    if (this.book_title) {
      loanData.book_title = this.book_title;
    }
    if (this.book_author) {
      loanData.book_author = this.book_author;
    }
    if (this.book_isbn) {
      loanData.book_isbn = this.book_isbn;
    }
    if (this.book_cover) {
      loanData.book_cover = this.book_cover;
    }

    // Include user fields if they were joined in the query
    if (this.user_name) {
      loanData.user_name = this.user_name;
    }
    if (this.user_email) {
      loanData.user_email = this.user_email;
    }

    if (includeRelations) {
      if (this.book) {
        loanData.book = typeof this.book.toSummary === 'function' 
          ? this.book.toSummary() 
          : this.book;
      }
      
      if (this.user) {
        loanData.user = typeof this.user.toJSON === 'function'
          ? this.user.toJSON()
          : this.user;
      }
    }

    return loanData;
  }

  /**
   * Get summary data for loan lists
   * @returns {Object} Summary data
   */
  toSummary() {
    return {
      id: this.id,
      book_id: this.book_id,
      user_id: this.user_id,
      loan_date: this.loan_date,
      due_date: this.due_date,
      return_date: this.return_date,
      status: this.status,
      status_info: this.getStatusInfo(),
      book_title: this.book?.title,
      book_author: this.book?.author,
      user_name: this.user?.fullName || `${this.user?.first_name} ${this.user?.last_name}`
    };
  }
}

module.exports = BookLoan;