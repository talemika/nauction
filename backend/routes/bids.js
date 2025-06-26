const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const { authenticateToken, validateBiddingBalance } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bids
// @desc    Place a bid on an auction
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { auctionId, bidAmount, maxBidAmount, isAutoBid = false } = req.body;
    const userId = req.user._id;

    // Validation
    if (!auctionId || !bidAmount) {
      return res.status(400).json({
        message: 'Auction ID and bid amount are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (bidAmount <= 0) {
      return res.status(400).json({
        message: 'Bid amount must be greater than 0',
        error: 'INVALID_BID_AMOUNT'
      });
    }

    // Find auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Check if auction can accept bids
    if (!auction.canAcceptBids()) {
      return res.status(400).json({
        message: 'This auction is not accepting bids',
        error: 'AUCTION_NOT_ACCEPTING_BIDS'
      });
    }

    // Check if user is trying to bid on their own auction (if seller is admin)
    if (auction.seller.toString() === userId.toString()) {
      return res.status(400).json({
        message: 'You cannot bid on your own auction',
        error: 'SELF_BIDDING_NOT_ALLOWED'
      });
    }

    // Check minimum bid amount
    const minimumBid = auction.getNextMinimumBid();
    if (bidAmount < minimumBid) {
      return res.status(400).json({
        message: `Bid amount must be at least ₦${minimumBid.toLocaleString()}`,
        error: 'BID_TOO_LOW',
        minimumBid
      });
    }

    // Check user balance (20% requirement)
    const requiredBalance = bidAmount * 0.2;
    if (req.user.balance < requiredBalance) {
      return res.status(400).json({
        message: `Insufficient balance. You need at least ₦${requiredBalance.toLocaleString()} (20% of bid amount) to place this bid.`,
        error: 'INSUFFICIENT_BALANCE',
        requiredBalance,
        currentBalance: req.user.balance
      });
    }

    // Validate auto-bid settings
    if (isAutoBid) {
      if (!maxBidAmount || maxBidAmount < bidAmount) {
        return res.status(400).json({
          message: 'Max bid amount must be greater than or equal to current bid amount for auto-bidding',
          error: 'INVALID_MAX_BID_AMOUNT'
        });
      }

      // Check if user can afford the max bid amount (20% requirement)
      const maxRequiredBalance = maxBidAmount * 0.2;
      if (req.user.balance < maxRequiredBalance) {
        return res.status(400).json({
          message: `Insufficient balance for max bid amount. You need at least ₦${maxRequiredBalance.toLocaleString()} (20% of max bid amount).`,
          error: 'INSUFFICIENT_BALANCE_FOR_MAX_BID',
          maxRequiredBalance,
          currentBalance: req.user.balance
        });
      }
    }

    // Create new bid
    const bid = new Bid({
      auction: auctionId,
      bidder: userId,
      amount: bidAmount,
      isAutoBid,
      maxBidAmount: isAutoBid ? maxBidAmount : null,
      incrementUsed: auction.bidIncrement,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Process payment hold
    await bid.processHold();
    await bid.save();

    // Update auction
    auction.currentPrice = bidAmount;
    auction.highestBidder = userId;
    auction.totalBids += 1;
    auction.bids.push(bid._id);

    // Auto-extend auction if enabled and bid is placed in last few minutes
    if (auction.autoExtend.enabled) {
      const timeRemaining = auction.timeRemaining;
      if (timeRemaining <= auction.autoExtend.timeExtension) {
        auction.endDate = new Date(auction.endDate.getTime() + auction.autoExtend.timeExtension);
      }
    }

    await auction.save();

    // Update bid statuses
    await Bid.updateBidStatuses(auctionId, bid._id);

    // Process auto-bidding from other users
    const autoBids = await Bid.processAutoBidding(auctionId, bidAmount);
    
    // If auto-bids were processed, update auction with highest auto-bid
    if (autoBids.length > 0) {
      const highestAutoBid = autoBids.reduce((highest, current) => 
        current.amount > highest.amount ? current : highest
      );
      
      if (highestAutoBid.amount > auction.currentPrice) {
        auction.currentPrice = highestAutoBid.amount;
        auction.highestBidder = highestAutoBid.bidder;
        auction.totalBids += autoBids.length;
        auction.bids.push(...autoBids.map(ab => ab._id));
        
        await auction.save();
        await Bid.updateBidStatuses(auctionId, highestAutoBid._id);
      }
    }

    // Populate bid for response
    const populatedBid = await Bid.findById(bid._id)
      .populate('bidder', 'name')
      .populate('auction', 'title currentPrice');

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: populatedBid,
      auction: {
        id: auction._id,
        currentPrice: auction.currentPrice,
        totalBids: auction.totalBids,
        timeRemaining: auction.timeRemaining,
        nextMinimumBid: auction.getNextMinimumBid()
      },
      autoBidsProcessed: autoBids.length,
      userBalance: req.user.balance - bid.holdAmount
    });
  } catch (error) {
    console.error('Place bid error:', error);
    
    if (error.message === 'Insufficient balance for bid hold') {
      return res.status(400).json({
        message: error.message,
        error: 'INSUFFICIENT_BALANCE'
      });
    }

    res.status(500).json({
      message: 'Failed to place bid',
      error: 'PLACE_BID_ERROR'
    });
  }
});

// @route   GET /api/bids/auction/:auctionId
// @desc    Get bid history for an auction
// @access  Public
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    const bids = await Bid.find({ auction: auctionId })
      .populate('bidder', 'name')
      .sort({ bidTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalBids = await Bid.countDocuments({ auction: auctionId });
    const biddingStats = await Bid.getBiddingStats(auctionId);

    res.json({
      message: 'Bid history retrieved successfully',
      bids,
      biddingStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBids / parseInt(limit)),
        totalBids,
        hasNext: page < Math.ceil(totalBids / parseInt(limit)),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({
      message: 'Failed to retrieve bid history',
      error: 'FETCH_BID_HISTORY_ERROR'
    });
  }
});

// @route   GET /api/bids/user/my-bids
// @desc    Get current user's bids
// @access  Private
router.get('/user/my-bids', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const query = { bidder: userId };
    if (status) {
      query.status = status;
    }

    const bids = await Bid.find(query)
      .populate('auction', 'title currentPrice endDate status images')
      .sort({ bidTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalBids = await Bid.countDocuments(query);

    // Add additional info for each bid
    const bidsWithInfo = bids.map(bid => {
      const bidObj = bid.toObject();
      if (bid.auction) {
        bidObj.auction.timeRemaining = bid.auction.endDate - new Date();
        bidObj.auction.timeRemainingFormatted = bid.auction.timeRemaining > 0 
          ? Math.ceil(bid.auction.timeRemaining / (1000 * 60)) + 'm'
          : 'Ended';
        bidObj.isWinning = bid.status === 'winning';
        bidObj.isOutbid = bid.status === 'outbid';
      }
      return bidObj;
    });

    res.json({
      message: 'User bids retrieved successfully',
      bids: bidsWithInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBids / parseInt(limit)),
        totalBids,
        hasNext: page < Math.ceil(totalBids / parseInt(limit)),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user bids',
      error: 'FETCH_USER_BIDS_ERROR'
    });
  }
});

// @route   GET /api/bids/user/winning
// @desc    Get current user's winning bids
// @access  Private
router.get('/user/winning', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const winningBids = await Bid.find({ 
      bidder: userId, 
      status: 'winning' 
    })
    .populate('auction', 'title currentPrice endDate status images')
    .sort({ bidTime: -1 });

    const bidsWithInfo = winningBids.map(bid => {
      const bidObj = bid.toObject();
      if (bid.auction) {
        bidObj.auction.timeRemaining = bid.auction.endDate - new Date();
        bidObj.auction.timeRemainingFormatted = bid.auction.timeRemaining > 0 
          ? Math.ceil(bid.auction.timeRemaining / (1000 * 60)) + 'm'
          : 'Ended';
      }
      return bidObj;
    });

    res.json({
      message: 'Winning bids retrieved successfully',
      winningBids: bidsWithInfo,
      count: winningBids.length
    });
  } catch (error) {
    console.error('Get winning bids error:', error);
    res.status(500).json({
      message: 'Failed to retrieve winning bids',
      error: 'FETCH_WINNING_BIDS_ERROR'
    });
  }
});

// @route   POST /api/bids/:bidId/cancel-auto
// @desc    Cancel auto-bidding for a specific bid
// @access  Private
router.post('/:bidId/cancel-auto', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user._id;

    const bid = await Bid.findById(bidId).populate('auction');
    if (!bid) {
      return res.status(404).json({
        message: 'Bid not found',
        error: 'BID_NOT_FOUND'
      });
    }

    // Check if user owns this bid
    if (bid.bidder.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only cancel your own auto-bids',
        error: 'ACCESS_DENIED'
      });
    }

    if (!bid.isAutoBid) {
      return res.status(400).json({
        message: 'This is not an auto-bid',
        error: 'NOT_AUTO_BID'
      });
    }

    if (bid.auction.status !== 'active') {
      return res.status(400).json({
        message: 'Cannot cancel auto-bidding for inactive auctions',
        error: 'AUCTION_NOT_ACTIVE'
      });
    }

    // Cancel auto-bidding by removing max bid amount
    bid.isAutoBid = false;
    bid.maxBidAmount = null;
    await bid.save();

    res.json({
      message: 'Auto-bidding cancelled successfully',
      bid: {
        id: bid._id,
        amount: bid.amount,
        isAutoBid: bid.isAutoBid,
        maxBidAmount: bid.maxBidAmount
      }
    });
  } catch (error) {
    console.error('Cancel auto-bid error:', error);
    res.status(500).json({
      message: 'Failed to cancel auto-bidding',
      error: 'CANCEL_AUTO_BID_ERROR'
    });
  }
});

// @route   PUT /api/bids/:bidId/update-max
// @desc    Update max bid amount for auto-bidding
// @access  Private
router.put('/:bidId/update-max', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;
    const { maxBidAmount } = req.body;
    const userId = req.user._id;

    if (!maxBidAmount || maxBidAmount <= 0) {
      return res.status(400).json({
        message: 'Valid max bid amount is required',
        error: 'INVALID_MAX_BID_AMOUNT'
      });
    }

    const bid = await Bid.findById(bidId).populate('auction');
    if (!bid) {
      return res.status(404).json({
        message: 'Bid not found',
        error: 'BID_NOT_FOUND'
      });
    }

    // Check if user owns this bid
    if (bid.bidder.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only update your own bids',
        error: 'ACCESS_DENIED'
      });
    }

    if (!bid.isAutoBid) {
      return res.status(400).json({
        message: 'This is not an auto-bid',
        error: 'NOT_AUTO_BID'
      });
    }

    if (bid.auction.status !== 'active') {
      return res.status(400).json({
        message: 'Cannot update auto-bid for inactive auctions',
        error: 'AUCTION_NOT_ACTIVE'
      });
    }

    if (maxBidAmount < bid.auction.currentPrice) {
      return res.status(400).json({
        message: 'Max bid amount must be greater than current auction price',
        error: 'MAX_BID_TOO_LOW'
      });
    }

    // Check if user can afford the new max bid amount
    const maxRequiredBalance = maxBidAmount * 0.2;
    if (req.user.balance < maxRequiredBalance) {
      return res.status(400).json({
        message: `Insufficient balance for new max bid amount. You need at least ₦${maxRequiredBalance.toLocaleString()} (20% of max bid amount).`,
        error: 'INSUFFICIENT_BALANCE_FOR_MAX_BID',
        maxRequiredBalance,
        currentBalance: req.user.balance
      });
    }

    bid.maxBidAmount = maxBidAmount;
    await bid.save();

    res.json({
      message: 'Max bid amount updated successfully',
      bid: {
        id: bid._id,
        amount: bid.amount,
        maxBidAmount: bid.maxBidAmount,
        isAutoBid: bid.isAutoBid
      }
    });
  } catch (error) {
    console.error('Update max bid error:', error);
    res.status(500).json({
      message: 'Failed to update max bid amount',
      error: 'UPDATE_MAX_BID_ERROR'
    });
  }
});

// @route   GET /api/bids/stats/user
// @desc    Get bidding statistics for current user
// @access  Private
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Bid.aggregate([
      { $match: { bidder: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          totalAmountBid: { $sum: '$amount' },
          averageBid: { $avg: '$amount' },
          highestBid: { $max: '$amount' },
          winningBids: {
            $sum: { $cond: [{ $eq: ['$status', 'winning'] }, 1, 0] }
          },
          wonBids: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
          },
          lostBids: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
          },
          autoBids: {
            $sum: { $cond: ['$isAutoBid', 1, 0] }
          }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalBids: 0,
      totalAmountBid: 0,
      averageBid: 0,
      highestBid: 0,
      winningBids: 0,
      wonBids: 0,
      lostBids: 0,
      autoBids: 0
    };

    // Get active auctions user is bidding on
    const activeAuctions = await Bid.find({
      bidder: userId,
      status: { $in: ['active', 'winning'] }
    }).populate('auction', 'title endDate').distinct('auction');

    res.json({
      message: 'User bidding statistics retrieved successfully',
      stats: {
        ...userStats,
        manualBids: userStats.totalBids - userStats.autoBids,
        activeAuctions: activeAuctions.length,
        successRate: userStats.totalBids > 0 
          ? Math.round((userStats.wonBids / userStats.totalBids) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Get user bidding stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve bidding statistics',
      error: 'FETCH_BIDDING_STATS_ERROR'
    });
  }
});

module.exports = router;

