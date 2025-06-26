const express = require('express');
const searchService = require('../utils/search');
const currencyConverter = require('../utils/currency');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search/auctions
// @desc    Search auctions with advanced filtering
// @access  Public
router.get('/auctions', optionalAuth, async (req, res) => {
  try {
    const { q: query } = req.query;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      condition: req.query.condition,
      location: req.query.location,
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      featured: req.query.featured,
      endingSoon: req.query.endingSoon,
      hasReserve: req.query.hasReserve,
      hasBuyNow: req.query.hasBuyNow
    };

    const results = await searchService.searchAuctions(query, options);

    res.json({
      message: 'Search completed successfully',
      ...results
    });
  } catch (error) {
    console.error('Auction search error:', error);
    res.status(500).json({
      message: 'Search failed',
      error: 'SEARCH_ERROR'
    });
  }
});

// @route   GET /api/search/users
// @desc    Search users (Admin only)
// @access  Private/Admin
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q: query } = req.query;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      role: req.query.role,
      isActive: req.query.isActive,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const results = await searchService.searchUsers(query, options);

    res.json({
      message: 'User search completed successfully',
      ...results
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      message: 'User search failed',
      error: 'USER_SEARCH_ERROR'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        message: 'Query too short',
        suggestions: []
      });
    }

    const suggestions = await searchService.getSearchSuggestions(query, parseInt(limit));

    res.json({
      message: 'Suggestions retrieved successfully',
      suggestions,
      query
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      message: 'Failed to get suggestions',
      error: 'SUGGESTIONS_ERROR'
    });
  }
});

// @route   GET /api/search/popular
// @desc    Get popular searches
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const popular = await searchService.getPopularSearches(parseInt(limit));

    res.json({
      message: 'Popular searches retrieved successfully',
      popular
    });
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({
      message: 'Failed to get popular searches',
      error: 'POPULAR_SEARCHES_ERROR'
    });
  }
});

// @route   GET /api/search/currency/rates
// @desc    Get current exchange rates
// @access  Public
router.get('/currency/rates', async (req, res) => {
  try {
    const rates = await currencyConverter.getCurrentRates();

    res.json({
      message: 'Exchange rates retrieved successfully',
      rates
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      message: 'Failed to get exchange rates',
      error: 'EXCHANGE_RATES_ERROR'
    });
  }
});

// @route   POST /api/search/currency/convert
// @desc    Convert currency
// @access  Public
router.post('/currency/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        message: 'Amount, fromCurrency, and toCurrency are required',
        error: 'MISSING_PARAMETERS'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0',
        error: 'INVALID_AMOUNT'
      });
    }

    const supportedCurrencies = ['NGN', 'USD'];
    if (!supportedCurrencies.includes(fromCurrency.toUpperCase()) || 
        !supportedCurrencies.includes(toCurrency.toUpperCase())) {
      return res.status(400).json({
        message: 'Only NGN and USD currencies are supported',
        error: 'UNSUPPORTED_CURRENCY'
      });
    }

    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return res.json({
        message: 'Same currency conversion',
        conversion: {
          originalAmount: amount,
          originalCurrency: fromCurrency.toUpperCase(),
          convertedAmount: amount,
          convertedCurrency: toCurrency.toUpperCase(),
          exchangeRate: 1,
          originalFormatted: currencyConverter.formatCurrency(amount, fromCurrency),
          convertedFormatted: currencyConverter.formatCurrency(amount, toCurrency)
        }
      });
    }

    const conversion = await currencyConverter.convertAndFormat(
      parseFloat(amount), 
      fromCurrency, 
      toCurrency
    );

    res.json({
      message: 'Currency converted successfully',
      conversion
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({
      message: 'Currency conversion failed',
      error: 'CONVERSION_ERROR'
    });
  }
});

// @route   GET /api/search/currency/dual/:amount
// @desc    Get dual currency display (NGN and USD)
// @access  Public
router.get('/currency/dual/:amount', async (req, res) => {
  try {
    const { amount } = req.params;
    const ngnAmount = parseFloat(amount);

    if (isNaN(ngnAmount) || ngnAmount <= 0) {
      return res.status(400).json({
        message: 'Valid amount is required',
        error: 'INVALID_AMOUNT'
      });
    }

    const dualDisplay = await currencyConverter.getDualCurrencyDisplay(ngnAmount);

    res.json({
      message: 'Dual currency display retrieved successfully',
      display: dualDisplay
    });
  } catch (error) {
    console.error('Dual currency display error:', error);
    res.status(500).json({
      message: 'Failed to get dual currency display',
      error: 'DUAL_CURRENCY_ERROR'
    });
  }
});

// @route   PUT /api/search/currency/update-rates
// @desc    Force update exchange rates (Admin only)
// @access  Private/Admin
router.put('/currency/update-rates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const success = await currencyConverter.updateExchangeRates();
    const rates = await currencyConverter.getCurrentRates();

    res.json({
      message: success ? 'Exchange rates updated successfully' : 'Failed to update rates, using defaults',
      success,
      rates
    });
  } catch (error) {
    console.error('Force update exchange rates error:', error);
    res.status(500).json({
      message: 'Failed to update exchange rates',
      error: 'UPDATE_RATES_ERROR'
    });
  }
});

// @route   GET /api/search/filters/options
// @desc    Get available filter options for search
// @access  Public
router.get('/filters/options', async (req, res) => {
  try {
    const categories = [
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Sports',
      'Books',
      'Art',
      'Collectibles',
      'Automotive',
      'Other'
    ];

    const conditions = [
      'New',
      'Like New',
      'Good',
      'Fair',
      'Poor'
    ];

    const sortOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price', label: 'Price' },
      { value: 'endDate', label: 'Ending Soon' },
      { value: 'startDate', label: 'Recently Listed' },
      { value: 'bids', label: 'Most Bids' },
      { value: 'views', label: 'Most Viewed' }
    ];

    const priceRanges = [
      { min: 0, max: 10000, label: 'Under ₦10,000' },
      { min: 10000, max: 50000, label: '₦10,000 - ₦50,000' },
      { min: 50000, max: 100000, label: '₦50,000 - ₦100,000' },
      { min: 100000, max: 500000, label: '₦100,000 - ₦500,000' },
      { min: 500000, max: null, label: 'Over ₦500,000' }
    ];

    res.json({
      message: 'Filter options retrieved successfully',
      filters: {
        categories,
        conditions,
        sortOptions,
        priceRanges
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      message: 'Failed to get filter options',
      error: 'FILTER_OPTIONS_ERROR'
    });
  }
});

module.exports = router;

