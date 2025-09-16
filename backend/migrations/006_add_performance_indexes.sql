-- Additional performance indexes for common query patterns

-- Composite indexes for book searches with filters
CREATE INDEX idx_books_author_available ON books(author, available_copies) WHERE available_copies > 0;
CREATE INDEX idx_books_title_available ON books(title, available_copies) WHERE available_copies > 0;
CREATE INDEX idx_books_year_available ON books(publication_year, available_copies) WHERE available_copies > 0;

-- Index for recent books
CREATE INDEX idx_books_recent ON books(created_at DESC) WHERE available_copies > 0;

-- Composite index for user loan history queries
CREATE INDEX idx_book_loans_user_date ON book_loans(user_id, loan_date DESC);

-- Index for librarian dashboard queries
CREATE INDEX idx_book_loans_active_due ON book_loans(due_date, status) WHERE status = 'active';

-- Index for book popularity queries
CREATE INDEX idx_book_loans_book_count ON book_loans(book_id, loan_date) WHERE status IN ('active', 'returned');

-- Index for user activity queries
CREATE INDEX idx_book_loans_user_activity ON book_loans(user_id, status, loan_date DESC);

-- Partial index for currently borrowed books
CREATE INDEX idx_book_loans_currently_borrowed ON book_loans(book_id, user_id, loan_date) WHERE status = 'active';

-- Index for category-based book searches
CREATE INDEX idx_book_categories_for_search ON book_categories(category_id, book_id);

-- Statistics for query optimizer
ANALYZE users;
ANALYZE books;
ANALYZE categories;
ANALYZE book_categories;
ANALYZE book_loans;