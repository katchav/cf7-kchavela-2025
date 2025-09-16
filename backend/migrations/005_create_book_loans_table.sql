-- Create loan status enum
CREATE TYPE loan_status AS ENUM ('active', 'returned', 'overdue');

-- Create book_loans table
CREATE TABLE book_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL,
    user_id UUID NOT NULL,
    loan_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP,
    status loan_status NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_book_loans_book FOREIGN KEY (book_id) 
        REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_book_loans_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
        
    -- Business rule constraints
    CONSTRAINT check_loan_dates CHECK (due_date > loan_date),
    CONSTRAINT check_return_date CHECK (return_date IS NULL OR return_date >= loan_date),
    CONSTRAINT check_returned_status CHECK (
        (status = 'returned' AND return_date IS NOT NULL) OR 
        (status != 'returned' AND return_date IS NULL)
    )
);

-- Create indexes for efficient queries
CREATE INDEX idx_book_loans_book_id ON book_loans(book_id);
CREATE INDEX idx_book_loans_user_id ON book_loans(user_id);
CREATE INDEX idx_book_loans_status ON book_loans(status);
CREATE INDEX idx_book_loans_due_date ON book_loans(due_date);
CREATE INDEX idx_book_loans_user_status ON book_loans(user_id, status);
CREATE INDEX idx_book_loans_book_status ON book_loans(book_id, status);

-- Index for overdue loans checking
CREATE INDEX idx_book_loans_overdue ON book_loans(due_date) WHERE status = 'active';

-- Unique constraint to prevent multiple active loans of the same book by the same user
CREATE UNIQUE INDEX idx_unique_active_user_book_loan 
ON book_loans(user_id, book_id) 
WHERE status = 'active';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_book_loans_updated_at BEFORE UPDATE ON book_loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();