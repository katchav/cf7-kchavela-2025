import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import bookService from '../../services/bookService';
import loanService from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await bookService.getBook(id);
      // Handle both direct book object and wrapped response
      const bookData = response.data || response;
      setBook(bookData);
    } catch (err) {
      setError('Failed to load book details');
      console.error('Error fetching book:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBorrowing(true);
    setError(null);
    setSuccessMessage('');

    try {
      await loanService.borrowBook(book.id);
      setSuccessMessage('Book borrowed successfully!');
      // Refresh book data to update availability
      await fetchBook();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to borrow book';
      setError(message);
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (error && !book) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!book) {
    return <div>Book not found</div>;
  }

  const coverUrl = book.cover_url || `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back
      </button>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="md:col-span-1">
            <img
              src={coverUrl}
              alt={book.title}
              className="w-full rounded-lg shadow-md"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
              }}
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
              <p className="mt-2 text-xl text-gray-600">by {book.author}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">ISBN:</span>
                <span className="ml-2 text-gray-600">{book.isbn}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Publisher:</span>
                <span className="ml-2 text-gray-600">{book.publisher}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Year:</span>
                <span className="ml-2 text-gray-600">{book.publication_year}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Copies:</span>
                <span className="ml-2 text-gray-600">{book.total_copies}</span>
              </div>
            </div>

            {book.categories && book.categories.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Categories:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {book.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  {book.available_copies > 0 ? (
                    <p className="text-lg text-green-600">
                      {book.available_copies} copies available
                    </p>
                  ) : (
                    <p className="text-lg text-red-600">Currently unavailable</p>
                  )}
                </div>
                {book.available_copies > 0 && (
                  <button
                    onClick={handleBorrow}
                    disabled={borrowing}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {borrowing ? 'Borrowing...' : 'Borrow Book'}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {book.description && (
              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                <p className="mt-2 text-gray-600">{book.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;