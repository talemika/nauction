const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');

// Search auctions (public endpoint - no auth required)
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      condition, 
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    let searchQuery = {};

    // Text search across title, description, and tags
    if (q) {
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Filter by category
    if (category) {
      searchQuery.category = { $regex: category, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      searchQuery.currentPrice = {};
      if (minPrice) searchQuery.currentPrice.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.currentPrice.$lte = parseFloat(maxPrice);
    }

    // Filter by condition
    if (condition) {
      searchQuery.condition = condition;
    }

    // Filter by status
    if (status) {
      searchQuery.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute search
    const auctions = await Auction.find(searchQuery)
      .populate('seller', 'username email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Auction.countDocuments(searchQuery);

    res.json({
      auctions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching auctions', error: error.message });
  }
});

// Get auction categories (for filter dropdown)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Auction.distinct('category');
    res.json(categories.filter(cat => cat)); // Remove null/empty categories
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get auction conditions (for filter dropdown)
router.get('/conditions', async (req, res) => {
  try {
    const conditions = ['new', 'like-new', 'good', 'fair', 'poor'];
    res.json(conditions);
  } catch (error) {
    console.error('Conditions error:', error);
    res.status(500).json({ message: 'Error fetching conditions', error: error.message });
  }
});

module.exports = router;

