import api from './api';

const bookService = {
  async getBooks(params = {}) {
    const response = await api.get('/books', { params });
    return response.data;
  },

  async getBook(id) {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  async searchBooks(searchParams) {
    const response = await api.get('/books', { params: searchParams });
    return response.data;
  },

  async getPopularBooks() {
    const response = await api.get('/books/popular');
    return response.data;
  },

  async getRecentBooks() {
    const response = await api.get('/books/recent');
    return response.data;
  },

  async getBooksByCategory(categoryId) {
    const response = await api.get(`/books/category/${categoryId}`);
    return response.data;
  },

  async checkAvailability(bookId) {
    const response = await api.get(`/books/${bookId}/availability`);
    return response.data;
  },

  // Librarian only
  async createBook(bookData) {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  async updateBook(id, bookData) {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  async deleteBook(id) {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/books/statistics');
    return response.data;
  },
};

export default bookService;