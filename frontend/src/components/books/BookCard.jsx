import React from 'react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  const coverUrl = book.cover_url || `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
  
  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="aspect-w-3 aspect-h-4 mb-4 relative">
        <img
          src={coverUrl}
          alt={book.title}
          className={`h-48 w-full object-cover rounded-md ${book.available_copies === 0 ? 'opacity-60' : ''}`}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150x200?text=No+Cover';
          }}
        />
        {book.available_copies === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black bg-opacity-40">
            <span className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
              UNAVAILABLE
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600">by {book.author}</p>
        <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
        <div className="flex items-center justify-between pt-2">
          <div>
            {book.available_copies > 0 ? (
              <span className="text-sm text-green-600">
                {book.available_copies} available
              </span>
            ) : (
              <span className="text-sm text-red-600">Not available</span>
            )}
          </div>
          <Link
            to={`/books/${book.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;