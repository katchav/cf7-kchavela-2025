import api from './api';

const categoryService = {
  async getCategories(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  async getCategory(id) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async getCategoryOptions() {
    const response = await api.get('/categories/options');
    return response.data;
  },

  async getPopularCategories() {
    const response = await api.get('/categories/popular');
    return response.data;
  },

  // Librarian only
  async createCategory(categoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;