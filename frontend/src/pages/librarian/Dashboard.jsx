import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../../services/bookService';
import loanService from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LibrarianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [loanStats, bookStats, overdue, popular] = await Promise.all([
        loanService.getLoanStatistics(),
        bookService.getStatistics(),
        loanService.getOverdueLoans({ limit: 5 }),
        loanService.getMostBorrowed(),
      ]);

      setStats({ ...loanStats, ...bookStats });
      setOverdueLoans(overdue.data || overdue);
      setMostBorrowed((popular.data || popular || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Librarian Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Books</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
            <p className="mt-1 text-sm text-gray-500">{stats.availableBooks} available</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Active Loans</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.activeLoans}</p>
            <p className="mt-1 text-sm text-gray-500">Currently borrowed</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Overdue Loans</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.overdueLoans}</p>
            <Link to="/librarian/loans?status=overdue" className="mt-1 text-sm text-red-600 hover:text-red-500">
              View all →
            </Link>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Members</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.totalMembers}</p>
            <p className="mt-1 text-sm text-gray-500">{stats.activeMembers} active</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Overdue Loans</h2>
              <Link
                to="/librarian/loans?status=overdue"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {overdueLoans.length === 0 ? (
              <p className="text-gray-600">No overdue loans</p>
            ) : (
              <div className="space-y-3">
                {overdueLoans.map((loan) => (
                  <div key={loan.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{loan.book_title}</p>
                        <p className="text-sm text-gray-600">
                          {loan.member_name} • Due: {formatDate(loan.due_date)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {Math.floor((new Date() - new Date(loan.due_date)) / (1000 * 60 * 60 * 24))} days late
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Most Borrowed Books</h2>
          </div>
          <div className="p-6">
            {mostBorrowed.length === 0 ? (
              <p className="text-gray-600">No borrowing data yet</p>
            ) : (
              <div className="space-y-3">
                {mostBorrowed.map((book, index) => (
                  <div key={book.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {book.borrow_count} loans
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/librarian/books"
            className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Books
          </Link>
          <Link
            to="/librarian/loans"
            className="flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View All Loans
          </Link>
          <Link
            to="/librarian/loans?status=overdue"
            className="flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Overdue Loans
          </Link>
          <Link
            to="/books"
            className="flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;