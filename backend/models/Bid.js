const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Auction reference is required']
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bidder reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [1, 'Bid amount must be at least ₦1']
  },
  // Auto-bidding functionality
  isAutoBid: {
    type: Boolean,
    default: false
  },
  maxBidAmount: {
    type: Number,
    default: null,
    min: [1, 'Max bid amount must be at least ₦1']
  },
  // Bid status
  status: {
    type: String,
    enum: ['active', 'outbid', 'winning', 'won', 'lost'],
    default: 'active'
  },
  // Bidding metadata
  bidTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  // Previous bid reference (for bid history)
  previousBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null
  },
  // Bid increment used
  incrementUsed: {
    type: Number,
    required: true
  },
  // Payment hold information
  holdAmount: {
    type: Number,
    default: 0 // 20% of bid amount held
  },
  holdReleased: {
    type: Boolean,
    default: false
  },
  holdReleaseDate: {
    type: Date,
    default: null
  },
  // Notification status
  notificationSent: {
    type: Boolean,
    default: false
  },
  // Proxy bid information (for auto-bidding)
  isProxyBid: {
    type: Boolean,
    default: false
  },
  proxyBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1, bidTime: -1 });
bidSchema.index({ auction: 1, bidder: 1 });
bidSchema.index({ status: 1 });
bidSchema.index({ bidTime: -1 });
bidSchema.index({ isAutoBid: 1, maxBidAmount: 1 });

// Virtual for bid age
bidSchema.virtual('bidAge').get(function() {
  return Date.now() - this.bidTime;
});

// Virtual for formatted bid time
bidSchema.virtual('bidTimeFormatted').get(function() {
  return this.bidTime.toLocaleString();
});

// Virtual for hold amount calculation
bidSchema.virtual('calculatedHoldAmount').get(function() {
  return Math.ceil(this.amount * 0.2); // 20% of bid amount
});

// Pre-save middleware to calculate hold amount
bidSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    this.holdAmount = Math.ceil(this.amount * 0.2);
  }
  next();
});

// Instance method to check if bid is still valid
bidSchema.methods.isValid = function() {
  return this.status === 'active' || this.status === 'winning';
};

// Instance method to check if user can still auto-bid
bidSchema.methods.canAutoBid = function(newBidAmount) {
  if (!this.isAutoBid || !this.maxBidAmount) return false;
  return newBidAmount <= this.maxBidAmount;
};

// Instance method to release hold amount
bidSchema.methods.releaseHold = async function() {
  if (!this.holdReleased) {
    const User = require('./User');
    const user = await User.findById(this.bidder);
    
    if (user) {
      user.addBalance(this.holdAmount);
      await user.save();
      
      this.holdReleased = true;
      this.holdReleaseDate = new Date();
      await this.save();
      
      return true;
    }
  }
  return false;
};

// Instance method to process payment hold
bidSchema.methods.processHold = async function() {
  const User = require('./User');
  const user = await User.findById(this.bidder);
  
  if (!user) {
    throw new Error('Bidder not found');
  }
  
  if (user.balance < this.holdAmount) {
    throw new Error('Insufficient balance for bid hold');
  }
  
  // Deduct hold amount from user balance
  user.deductBalance(this.holdAmount);
  await user.save();
  
  return true;
};

// Static method to find highest bid for auction
bidSchema.statics.findHighestBid = function(auctionId) {
  return this.findOne({ auction: auctionId })
    .sort({ amount: -1 })
    .populate('bidder', 'name email');
};

// Static method to find user's bids for auction
bidSchema.statics.findUserBids = function(auctionId, userId) {
  return this.find({ auction: auctionId, bidder: userId })
    .sort({ bidTime: -1 });
};

// Static method to find active auto-bids for auction
bidSchema.statics.findActiveAutoBids = function(auctionId) {
  return this.find({
    auction: auctionId,
    isAutoBid: true,
    status: { $in: ['active', 'winning'] },
    maxBidAmount: { $gt: 0 }
  }).populate('bidder', 'name email balance');
};

// Static method to get bid history for auction
bidSchema.statics.getBidHistory = function(auctionId, limit = 50) {
  return this.find({ auction: auctionId })
    .sort({ bidTime: -1 })
    .limit(limit)
    .populate('bidder', 'name')
    .select('amount bidTime status isAutoBid');
};

// Static method to process auto-bidding
bidSchema.statics.processAutoBidding = async function(auctionId, newBidAmount) {
  const autoBids = await this.findActiveAutoBids(auctionId);
  const processedBids = [];
  
  for (const autoBid of autoBids) {
    if (autoBid.canAutoBid(newBidAmount + autoBid.incrementUsed)) {
      const nextBidAmount = newBidAmount + autoBid.incrementUsed;
      
      // Check if user has sufficient balance
      if (autoBid.bidder.canBidOnItem(nextBidAmount)) {
        const newAutoBid = new this({
          auction: auctionId,
          bidder: autoBid.bidder._id,
          amount: nextBidAmount,
          isAutoBid: true,
          maxBidAmount: autoBid.maxBidAmount,
          incrementUsed: autoBid.incrementUsed,
          isProxyBid: true,
          proxyBidder: autoBid.bidder._id
        });
        
        await newAutoBid.save();
        await newAutoBid.processHold();
        
        processedBids.push(newAutoBid);
      }
    }
  }
  
  return processedBids;
};

// Static method to update bid statuses after new bid
bidSchema.statics.updateBidStatuses = async function(auctionId, winningBidId) {
  // Set all other bids to 'outbid'
  await this.updateMany(
    { 
      auction: auctionId, 
      _id: { $ne: winningBidId },
      status: { $in: ['active', 'winning'] }
    },
    { status: 'outbid' }
  );
  
  // Set winning bid to 'winning'
  await this.updateOne(
    { _id: winningBidId },
    { status: 'winning' }
  );
};

// Static method to finalize auction bids
bidSchema.statics.finalizeAuctionBids = async function(auctionId, winnerId) {
  // Set winner's bid to 'won'
  await this.updateMany(
    { auction: auctionId, bidder: winnerId },
    { status: 'won' }
  );
  
  // Set all other bids to 'lost'
  await this.updateMany(
    { 
      auction: auctionId, 
      bidder: { $ne: winnerId },
      status: { $ne: 'won' }
    },
    { status: 'lost' }
  );
  
  // Release holds for losing bids
  const losingBids = await this.find({
    auction: auctionId,
    bidder: { $ne: winnerId },
    holdReleased: false
  });
  
  for (const bid of losingBids) {
    await bid.releaseHold();
  }
};

// Static method to get bidding statistics
bidSchema.statics.getBiddingStats = async function(auctionId) {
  const stats = await this.aggregate([
    { $match: { auction: mongoose.Types.ObjectId(auctionId) } },
    {
      $group: {
        _id: null,
        totalBids: { $sum: 1 },
        uniqueBidders: { $addToSet: '$bidder' },
        highestBid: { $max: '$amount' },
        lowestBid: { $min: '$amount' },
        averageBid: { $avg: '$amount' },
        autoBidsCount: {
          $sum: { $cond: ['$isAutoBid', 1, 0] }
        }
      }
    },
    {
      $project: {
        totalBids: 1,
        uniqueBiddersCount: { $size: '$uniqueBidders' },
        highestBid: 1,
        lowestBid: 1,
        averageBid: { $round: ['$averageBid', 2] },
        autoBidsCount: 1,
        manualBidsCount: { $subtract: ['$totalBids', '$autoBidsCount'] }
      }
    }
  ]);
  
  return stats[0] || {
    totalBids: 0,
    uniqueBiddersCount: 0,
    highestBid: 0,
    lowestBid: 0,
    averageBid: 0,
    autoBidsCount: 0,
    manualBidsCount: 0
  };
};

module.exports = mongoose.model('Bid', bidSchema);

