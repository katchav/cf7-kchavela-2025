import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import loanService from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [returning, setReturning] = useState({});

  useEffect(() => {
    fetchLoans();
  }, [filter]);

  const fetchLoans = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await loanService.getMyLoans(params);
      setLoans(response.data || response);
    } catch (err) {
      setError('Failed to load loans');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleReturn = async (loanId) => {
    setReturning({ ...returning, [loanId]: true });
    try {
      await loanService.returnBook(loanId);
      // Refresh loans after successful return
      await fetchLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to return book');
    } finally {
      setReturning({ ...returning, [loanId]: false });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      returned: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <h1 className="text-3xl font-bold text-gray-900">My Loans</h1>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Loan History</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Loans</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {loans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No loans found.</p>
            <Link
              to="/books"
              className="mt-4 inline-block text-blue-600 hover:text-blue-500"
            >
              Browse books to borrow →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Loan Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Return Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {loan.book_title}
                        </div>
                        <div className="text-sm text-gray-500">by {loan.book_author}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(loan.loan_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(loan.due_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {loan.return_date ? formatDate(loan.return_date) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {loan.status === 'active' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          disabled={returning[loan.id]}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {returning[loan.id] ? 'Returning...' : 'Return'}
                        </button>
                      )}
                      {loan.status === 'overdue' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          disabled={returning[loan.id]}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {returning[loan.id] ? 'Returning...' : 'Return (Overdue)'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLoans;