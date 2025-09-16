import React, { useState, useEffect } from 'react';
import categoryService from '../../services/categoryService';

const SearchFilters = ({ onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    search: '',
    author: '',
    isbn: '',
    category: '',
    availability: 'all',
    ...initialFilters,
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      // Handle both array and object with data property
      const data = Array.isArray(response) ? response : (response.data || []);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const activeFilters = {};
    
    // Only include non-empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        activeFilters[key] = value;
      }
    });
    
    onSearch(activeFilters);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      author: '',
      isbn: '',
      category: '',
      availability: 'all',
    });
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900">Search & Filter Books</h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Title Search
          </label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search by title..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={filters.author}
            onChange={handleChange}
            placeholder="Search by author..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
            ISBN
          </label>
          <input
            type="text"
            id="isbn"
            name="isbn"
            value={filters.isbn}
            onChange={handleChange}
            placeholder="Search by ISBN..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
            Availability
          </label>
          <select
            id="availability"
            name="availability"
            value={filters.availability}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Books</option>
            <option value="available">Available Only</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default SearchFilters;