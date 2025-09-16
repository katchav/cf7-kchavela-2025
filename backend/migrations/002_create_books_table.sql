-- Create books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(300) NOT NULL,
    publisher VARCHAR(200),
    publication_year INTEGER,
    description TEXT,
    cover_image_url TEXT,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure available copies never exceed total copies
    CONSTRAINT check_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- Create indexes for efficient searching
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_publisher ON books(publisher);
CREATE INDEX idx_books_publication_year ON books(publication_year);
CREATE INDEX idx_books_available_copies ON books(available_copies) WHERE available_copies > 0;

-- Full-text search index for title and author
CREATE INDEX idx_books_search ON books USING gin(to_tsvector('english', title || ' ' || author));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();