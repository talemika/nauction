const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const { authenticateToken, requireAdmin, optionalAuth, validateBiddingBalance } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/auctions
// @desc    Get all auctions with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status = 'active',
      minPrice,
      maxPrice,
      search,
      sortBy = 'endDate',
      sortOrder = 'asc',
      featured
    } = req.query;

    const query = {};

    // Filter by status
    if (status === 'active') {
      const now = new Date();
      query.status = 'active';
      query.startDate = { $lte: now };
      query.endDate = { $gt: now };
    } else if (status !== 'all') {
      query.status = status;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by price range
    if (minPrice) {
      query.currentPrice = { $gte: parseInt(minPrice) };
    }
    if (maxPrice) {
      query.currentPrice = { ...query.currentPrice, $lte: parseInt(maxPrice) };
    }

    // Filter by featured
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'price':
        sortOptions.currentPrice = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'endDate':
        sortOptions.endDate = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'bids':
        sortOptions.totalBids = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'created':
        sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortOptions.endDate = 1;
    }

    const auctions = await Auction.find(query)
      .populate('seller', 'name')
      .populate('highestBidder', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-adminNotes');

    const total = await Auction.countDocuments(query);

    // Add time remaining and other computed fields
    const auctionsWithExtras = auctions.map(auction => {
      const auctionObj = auction.toObject();
      auctionObj.timeRemaining = auction.timeRemaining;
      auctionObj.timeRemainingFormatted = auction.timeRemainingFormatted;
      auctionObj.canBuyNow = auction.canBuyNow;
      auctionObj.reserveMet = auction.reserveMet;
      auctionObj.nextMinimumBid = auction.getNextMinimumBid();
      return auctionObj;
    });

    res.json({
      message: 'Auctions retrieved successfully',
      auctions: auctionsWithExtras,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAuctions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        category,
        status,
        minPrice,
        maxPrice,
        search,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({
      message: 'Failed to retrieve auctions',
      error: 'FETCH_AUCTIONS_ERROR'
    });
  }
});

// @route   GET /api/auctions/:id
// @desc    Get single auction by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id)
      .populate('seller', 'name email phone')
      .populate('highestBidder', 'name')
      .populate('winner', 'name email');

    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Increment view count
    await auction.incrementViews();

    // Get bid history
    const bidHistory = await Bid.getBidHistory(id, 20);

    // Get bidding statistics
    const biddingStats = await Bid.getBiddingStats(id);

    // Check if user is watching this auction
    let isWatching = false;
    if (req.user) {
      isWatching = auction.watchers.includes(req.user._id);
    }

    const auctionObj = auction.toObject();
    auctionObj.timeRemaining = auction.timeRemaining;
    auctionObj.timeRemainingFormatted = auction.timeRemainingFormatted;
    auctionObj.canBuyNow = auction.canBuyNow;
    auctionObj.reserveMet = auction.reserveMet;
    auctionObj.nextMinimumBid = auction.getNextMinimumBid();
    auctionObj.isWatching = isWatching;
    auctionObj.bidHistory = bidHistory;
    auctionObj.biddingStats = biddingStats;

    res.json({
      message: 'Auction retrieved successfully',
      auction: auctionObj
    });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({
      message: 'Failed to retrieve auction',
      error: 'FETCH_AUCTION_ERROR'
    });
  }
});

// @route   POST /api/auctions
// @desc    Create new auction (Admin only)
// @access  Private/Admin
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      brand,
      model,
      startingPrice,
      reservePrice,
      buyItNowPrice,
      bidIncrement,
      startDate,
      endDate,
      location,
      shipping,
      features,
      autoExtend
    } = req.body;

    // Validation
    if (!title || !description || !category || !condition || !startingPrice || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Required fields: title, description, category, condition, startingPrice, startDate, endDate',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        message: 'Start date must be in the future',
        error: 'INVALID_START_DATE'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        message: 'End date must be after start date',
        error: 'INVALID_END_DATE'
      });
    }

    // Validate pricing
    if (reservePrice && reservePrice < startingPrice) {
      return res.status(400).json({
        message: 'Reserve price must be greater than or equal to starting price',
        error: 'INVALID_RESERVE_PRICE'
      });
    }

    if (buyItNowPrice && buyItNowPrice <= startingPrice) {
      return res.status(400).json({
        message: 'Buy it now price must be greater than starting price',
        error: 'INVALID_BUY_NOW_PRICE'
      });
    }

    const auction = new Auction({
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      brand: brand?.trim(),
      model: model?.trim(),
      startingPrice,
      reservePrice: reservePrice || null,
      buyItNowPrice: buyItNowPrice || null,
      bidIncrement: bidIncrement || 100,
      startDate: start,
      endDate: end,
      seller: req.user._id,
      location,
      shipping,
      features: features || [],
      autoExtend: autoExtend || { enabled: false },
      status: start <= now ? 'active' : 'scheduled'
    });

    await auction.save();

    const populatedAuction = await Auction.findById(auction._id)
      .populate('seller', 'name email');

    res.status(201).json({
      message: 'Auction created successfully',
      auction: populatedAuction
    });
  } catch (error) {
    console.error('Create auction error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        error: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      message: 'Failed to create auction',
      error: 'CREATE_AUCTION_ERROR'
    });
  }
});

// @route   PUT /api/auctions/:id
// @desc    Update auction (Admin only)
// @access  Private/Admin
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Prevent updating active auctions with bids
    if (auction.status === 'active' && auction.totalBids > 0) {
      return res.status(400).json({
        message: 'Cannot update auction with existing bids',
        error: 'AUCTION_HAS_BIDS'
      });
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.seller;
    delete updateData.totalBids;
    delete updateData.currentPrice;
    delete updateData.highestBidder;
    delete updateData.bids;
    delete updateData.winner;
    delete updateData.finalPrice;

    const updatedAuction = await Auction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    res.json({
      message: 'Auction updated successfully',
      auction: updatedAuction
    });
  } catch (error) {
    console.error('Update auction error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        error: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      message: 'Failed to update auction',
      error: 'UPDATE_AUCTION_ERROR'
    });
  }
});

// @route   DELETE /api/auctions/:id
// @desc    Delete auction (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Prevent deleting auctions with bids
    if (auction.totalBids > 0) {
      return res.status(400).json({
        message: 'Cannot delete auction with existing bids. Cancel instead.',
        error: 'AUCTION_HAS_BIDS'
      });
    }

    await Auction.findByIdAndDelete(id);

    res.json({
      message: 'Auction deleted successfully',
      deletedAuction: {
        id: auction._id,
        title: auction.title
      }
    });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({
      message: 'Failed to delete auction',
      error: 'DELETE_AUCTION_ERROR'
    });
  }
});

// @route   POST /api/auctions/:id/watch
// @desc    Add/remove auction from watchlist
// @access  Private
router.post('/:id/watch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    const isWatching = auction.watchers.includes(userId);

    if (isWatching) {
      auction.removeWatcher(userId);
      await auction.save();
      
      res.json({
        message: 'Auction removed from watchlist',
        isWatching: false,
        watchCount: auction.watchCount
      });
    } else {
      auction.addWatcher(userId);
      await auction.save();
      
      res.json({
        message: 'Auction added to watchlist',
        isWatching: true,
        watchCount: auction.watchCount
      });
    }
  } catch (error) {
    console.error('Watch auction error:', error);
    res.status(500).json({
      message: 'Failed to update watchlist',
      error: 'WATCH_ERROR'
    });
  }
});

// @route   POST /api/auctions/:id/buy-now
// @desc    Buy auction item immediately
// @access  Private
router.post('/:id/buy-now', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    if (!auction.canBuyNow) {
      return res.status(400).json({
        message: 'Buy it now is not available for this auction',
        error: 'BUY_NOW_NOT_AVAILABLE'
      });
    }

    if (!auction.isActive()) {
      return res.status(400).json({
        message: 'Auction is not active',
        error: 'AUCTION_NOT_ACTIVE'
      });
    }

    // Check if user has sufficient balance
    if (!req.user.canBidOnItem(auction.buyItNowPrice)) {
      return res.status(400).json({
        message: `Insufficient balance. You need at least ₦${(auction.buyItNowPrice * 0.2).toLocaleString()} to buy this item.`,
        error: 'INSUFFICIENT_BALANCE'
      });
    }

    // Process buy now
    auction.winner = userId;
    auction.finalPrice = auction.buyItNowPrice;
    auction.currentPrice = auction.buyItNowPrice;
    auction.status = 'sold';
    auction.endDate = new Date(); // End auction immediately

    await auction.save();

    // Create a winning bid record
    const winningBid = new Bid({
      auction: id,
      bidder: userId,
      amount: auction.buyItNowPrice,
      status: 'won',
      incrementUsed: 0
    });

    await winningBid.save();
    await winningBid.processHold();

    // Update user's won auctions
    await User.findByIdAndUpdate(userId, {
      $push: { wonAuctions: id }
    });

    res.json({
      message: 'Item purchased successfully',
      auction: {
        id: auction._id,
        title: auction.title,
        finalPrice: auction.finalPrice,
        status: auction.status
      },
      bid: winningBid
    });
  } catch (error) {
    console.error('Buy now error:', error);
    res.status(500).json({
      message: 'Failed to purchase item',
      error: 'BUY_NOW_ERROR'
    });
  }
});

// @route   GET /api/auctions/categories/list
// @desc    Get list of auction categories
// @access  Public
router.get('/categories/list', (req, res) => {
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

  res.json({
    message: 'Categories retrieved successfully',
    categories
  });
});

// @route   GET /api/auctions/featured/list
// @desc    Get featured auctions
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const featuredAuctions = await Auction.findFeatured()
      .populate('seller', 'name')
      .populate('highestBidder', 'name')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const auctionsWithExtras = featuredAuctions.map(auction => {
      const auctionObj = auction.toObject();
      auctionObj.timeRemaining = auction.timeRemaining;
      auctionObj.timeRemainingFormatted = auction.timeRemainingFormatted;
      auctionObj.canBuyNow = auction.canBuyNow;
      auctionObj.reserveMet = auction.reserveMet;
      return auctionObj;
    });

    res.json({
      message: 'Featured auctions retrieved successfully',
      auctions: auctionsWithExtras
    });
  } catch (error) {
    console.error('Get featured auctions error:', error);
    res.status(500).json({
      message: 'Failed to retrieve featured auctions',
      error: 'FETCH_FEATURED_ERROR'
    });
  }
});

// @route   GET /api/auctions/ending-soon/list
// @desc    Get auctions ending soon
// @access  Public
router.get('/ending-soon/list', async (req, res) => {
  try {
    const { hours = 24, limit = 10 } = req.query;

    const endingSoonAuctions = await Auction.findEndingSoon(parseInt(hours))
      .populate('seller', 'name')
      .populate('highestBidder', 'name')
      .limit(parseInt(limit));

    const auctionsWithExtras = endingSoonAuctions.map(auction => {
      const auctionObj = auction.toObject();
      auctionObj.timeRemaining = auction.timeRemaining;
      auctionObj.timeRemainingFormatted = auction.timeRemainingFormatted;
      auctionObj.canBuyNow = auction.canBuyNow;
      auctionObj.reserveMet = auction.reserveMet;
      return auctionObj;
    });

    res.json({
      message: 'Ending soon auctions retrieved successfully',
      auctions: auctionsWithExtras
    });
  } catch (error) {
    console.error('Get ending soon auctions error:', error);
    res.status(500).json({
      message: 'Failed to retrieve ending soon auctions',
      error: 'FETCH_ENDING_SOON_ERROR'
    });
  }
});

module.exports = router;

