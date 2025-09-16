import api from './api';

const loanService = {
  async borrowBook(bookId) {
    const response = await api.post('/loans/borrow', { book_id: bookId });
    return response.data;
  },

  async returnBook(loanId) {
    const response = await api.post(`/loans/${loanId}/return`, {});
    return response.data;
  },

  async renewLoan(loanId) {
    const response = await api.post(`/loans/${loanId}/renew`);
    return response.data;
  },

  async getMyLoans(params = {}) {
    const response = await api.get('/loans/my-loans', { params });
    return response.data;
  },

  async checkEligibility() {
    const response = await api.get('/loans/eligibility');
    return response.data;
  },

  async getMemberSummary() {
    const response = await api.get('/loans/member-summary');
    return response.data;
  },

  // Librarian only
  async getAllLoans(params = {}) {
    const response = await api.get('/loans', { params });
    return response.data;
  },

  async getOverdueLoans(params = {}) {
    const response = await api.get('/loans/overdue', { params });
    return response.data;
  },

  async forceReturn(loanId) {
    const response = await api.post(`/loans/${loanId}/force-return`);
    return response.data;
  },

  async getLoanStatistics() {
    const response = await api.get('/loans/statistics');
    return response.data;
  },

  async getMostBorrowed() {
    const response = await api.get('/loans/most-borrowed');
    return response.data;
  },
};

export default loanService;