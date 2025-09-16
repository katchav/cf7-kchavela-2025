import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import BookList from './pages/books/BookList';
import BookDetail from './pages/books/BookDetail';
import MyLoans from './pages/loans/MyLoans';
import LibrarianDashboard from './pages/librarian/Dashboard';
import ManageBooks from './pages/librarian/ManageBooks';
import AllLoans from './pages/librarian/AllLoans';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          
          <Route
            path="/books"
            element={
              <Layout>
                <BookList />
              </Layout>
            }
          />
          
          <Route
            path="/books/:id"
            element={
              <Layout>
                <BookDetail />
              </Layout>
            }
          />
          
          <Route
            path="/my-loans"
            element={
              <PrivateRoute>
                <Layout>
                  <MyLoans />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/librarian/dashboard"
            element={
              <PrivateRoute roles={['librarian']}>
                <Layout>
                  <LibrarianDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/librarian/books"
            element={
              <PrivateRoute roles={['librarian']}>
                <Layout>
                  <ManageBooks />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/librarian/loans"
            element={
              <PrivateRoute roles={['librarian']}>
                <Layout>
                  <AllLoans />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;