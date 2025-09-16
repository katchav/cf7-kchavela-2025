-- Create book_categories junction table for many-to-many relationship
CREATE TABLE book_categories (
    book_id UUID NOT NULL,
    category_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite primary key to prevent duplicate associations
    PRIMARY KEY (book_id, category_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_book_categories_book FOREIGN KEY (book_id) 
        REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_book_categories_category FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX idx_book_categories_book_id ON book_categories(book_id);
CREATE INDEX idx_book_categories_category_id ON book_categories(category_id);