import React, { useState, useEffect } from 'react';
import bookService from '../../services/bookService';
import BookCard from '../../components/books/BookCard';
import SearchFilters from '../../components/books/SearchFilters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchBooks();
  }, [pagination.page, filters]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await bookService.getBooks({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setBooks(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load books');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Browse Books</h1>

      <SearchFilters onSearch={handleSearch} initialFilters={filters} />

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <>
          {books.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">No books found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BookList;