import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import bookService from '../services/bookService';
import loanService from '../services/loanService';
import BookCard from '../components/books/BookCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Home = () => {
  const { user, isLibrarian, login } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user) {
        const response = await bookService.getBooks({ limit: 8 });
        setBooks(response.data || []);
      }
      
      if (isLibrarian()) {
        const loanStats = await loanService.getLoanStatistics();
        setStats(loanStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to the Library System
        </h1>
        {user ? (
          <p className="mt-2 text-lg text-gray-600">
            Hello, {user.first_name} {user.last_name}!
          </p>
        ) : (
          <div className="mt-8">
            <div className="w-full max-w-md mx-auto space-y-8">
              <div>
                <p className="text-center text-sm text-gray-600">
                  Sign in to your account or{' '}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    create a new account
                  </Link>
                </p>
              </div>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                <div className="-space-y-px rounded-md shadow-sm">
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loginLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>

                <div className="mt-6 rounded-md bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Demo accounts:</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-500">
                    <li>Librarian: librarian@library.com / LibPass123!</li>
                    <li>Member: member@library.com / MemPass123!</li>
                  </ul>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {isLibrarian() && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Books</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Active Loans</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.activeLoans}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Overdue Loans</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.overdueLoans}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Members</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.totalMembers}</p>
          </div>
        </div>
      )}

      {user && books.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Available Books</h2>
            <Link
              to="/books"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;