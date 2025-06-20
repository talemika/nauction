import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { api } from '../lib/api';

const SearchComponent = ({ onResults, onLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [categoriesRes, conditionsRes] = await Promise.all([
          api.get('/search/categories'),
          api.get('/search/conditions')
        ]);
        setCategories(categoriesRes.data);
        setConditions(conditionsRes.data);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  const handleSearch = async (page = 1) => {
    setIsLoading(true);
    onLoading?.(true);
    
    try {
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.condition) params.append('condition', filters.condition);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await api.get(`/search?${params.toString()}`);
      onResults?.(response.data);
    } catch (error) {
      console.error('Search error:', error);
      onResults?.({ auctions: [], pagination: { current: 1, pages: 1, total: 0 } });
    } finally {
      setIsLoading(false);
      onLoading?.(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search auctions by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Condition</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Date Created</option>
                <option value="endTime">Ending Soon</option>
                <option value="currentPrice">Price</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchComponent;

