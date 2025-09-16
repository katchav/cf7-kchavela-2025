import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import loanService from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AllLoans = () => {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(statusFilter);
  const [returning, setReturning] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchLoans();
  }, [filter, pagination.page]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await loanService.getAllLoans(params);
      setLoans(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load loans');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceReturn = async (loanId) => {
    if (!confirm('Are you sure you want to force return this book?')) {
      return;
    }

    setReturning({ ...returning, [loanId]: true });
    try {
      await loanService.forceReturn(loanId);
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

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading && loans.length === 0) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">All Loans</h1>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Loan Records</h2>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
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
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Member
                    </th>
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
                            {loan.member_name}
                          </div>
                          <div className="text-sm text-gray-500">{loan.member_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {loan.book_title}
                          </div>
                          <div className="text-sm text-gray-500">ISBN: {loan.book_isbn}</div>
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
                        {(loan.status === 'active' || loan.status === 'overdue') && (
                          <button
                            onClick={() => handleForceReturn(loan.id)}
                            disabled={returning[loan.id]}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            {returning[loan.id] ? 'Returning...' : 'Force Return'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllLoans;