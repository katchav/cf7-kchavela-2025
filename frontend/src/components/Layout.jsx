import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout, isLibrarian } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link
                to="/"
                className="flex flex-shrink-0 items-center text-xl font-bold text-gray-900"
              >
                Library System
              </Link>
              <div className="ml-6 flex space-x-4">
                {user && (
                  <>
                    <Link
                      to="/books"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      Browse Books
                    </Link>
                    {!isLibrarian() && (
                      <Link
                        to="/my-loans"
                        className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                      >
                        My Loans
                      </Link>
                    )}
                  </>
                )}
                {isLibrarian() && (
                  <>
                    <Link
                      to="/librarian/dashboard"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      Librarian Dashboard
                    </Link>
                    <Link
                      to="/librarian/books"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      Manage Books
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user.first_name} {user.last_name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};

export default Layout;