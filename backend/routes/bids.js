const express = require('express');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const authenticateToken = require('./auth').authenticateToken;

const router = express.Router();

// Place a bid
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { auctionId, amount, currency } = req.body;

    // Check if auction exists and is active
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (!auction.isActive()) {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Check if user is not the seller
    if (auction.seller.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot bid on your own auction' });
    }

    // Use auction's currency if no currency specified
    const bidCurrency = currency || auction.currency;

    // Check if bid amount is higher than current price
    if (amount <= auction.currentPrice) {
      const currencySymbol = auction.currency === 'NGN' ? '₦' : '$';
      return res.status(400).json({ 
        message: `Bid amount must be higher than current price of ${currencySymbol}${auction.currentPrice}` 
      });
    }

    // Create new bid
    const bid = new Bid({
      auction: auctionId,
      bidder: req.user.userId,
      amount,
      currency: bidCurrency
    });
    await bid.save();
    await bid.populate('bidder', 'username');

    res.status(201).json({
      message: 'Bid placed successfully',
      bid
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    if (error.message.includes('Bid amount must be higher') || 
        error.message.includes('Auction is not active')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bids for an auction
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate('bidder', 'username')
      .sort({ timestamp: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bids
router.get('/user/my-bids', authenticateToken, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.userId })
      .populate('auction', 'title currentPrice status endTime')
      .sort({ timestamp: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get highest bid for an auction
router.get('/auction/:auctionId/highest', async (req, res) => {
  try {
    const highestBid = await Bid.findOne({ auction: req.params.auctionId })
      .populate('bidder', 'username')
      .sort({ amount: -1 });

    res.json(highestBid);
  } catch (error) {
    console.error('Error fetching highest bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

