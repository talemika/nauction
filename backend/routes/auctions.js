const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const authenticateToken = require('./auth').authenticateToken;
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Get all active auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await Auction.find({ status: 'active' })
      .populate('seller', 'username')
      .populate('winner', 'username')
      .sort({ createdAt: -1 });

    // Update auction statuses
    for (let auction of auctions) {
      await auction.updateStatus();
    }

    res.json(auctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get auction by ID
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'username')
      .populate('winner', 'username');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Update auction status
    await auction.updateStatus();

    // Get bid history
    const bids = await Bid.find({ auction: auction._id })
      .populate('bidder', 'username')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      auction,
      bids
    });
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new auction (requires admin authentication)
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startingPrice, 
      media, 
      currency,
      category,
      condition,
      tags,
      startTime,
      endTime,
      duration
    } = req.body;

    // Calculate end time
    let auctionEndTime;
    if (endTime) {
      auctionEndTime = new Date(endTime);
    } else if (startTime && duration) {
      auctionEndTime = new Date(startTime);
      auctionEndTime.setHours(auctionEndTime.getHours() + duration);
    } else {
      // Default: start now, end in 24 hours
      auctionEndTime = new Date();
      auctionEndTime.setHours(auctionEndTime.getHours() + (duration || 24));
    }

    const auctionStartTime = startTime ? new Date(startTime) : new Date();

    const auction = new Auction({
      title,
      description,
      startingPrice,
      currency: currency || 'NGN',
      media: media || [],
      category,
      condition: condition || 'good',
      tags: tags || [],
      seller: req.user.userId,
      startTime: auctionStartTime,
      endTime: auctionEndTime
    });

    await auction.save();
    await auction.populate('seller', 'username');

    res.status(201).json({
      message: 'Auction created successfully',
      auction
    });
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's auctions
router.get('/user/my-auctions', authenticateToken, async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user.userId })
      .populate('winner', 'username')
      .sort({ createdAt: -1 });

    res.json(auctions);
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel auction (only by seller)
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.seller.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this auction' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Cannot cancel non-active auction' });
    }

    auction.status = 'cancelled';
    await auction.save();

    res.json({ message: 'Auction cancelled successfully', auction });
  } catch (error) {
    console.error('Error cancelling auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

