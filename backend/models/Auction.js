const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Auction title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Auction description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Art', 'Collectibles', 'Automotive', 'Other'],
    default: 'Other'
  },
  // Item details
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    required: [true, 'Item condition is required']
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  // Pricing
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [1, 'Starting price must be at least ₦1']
  },
  reservePrice: {
    type: Number,
    default: null,
    min: [0, 'Reserve price cannot be negative']
  },
  buyItNowPrice: {
    type: Number,
    default: null,
    min: [0, 'Buy it now price cannot be negative']
  },
  currentPrice: {
    type: Number,
    default: function() { return this.startingPrice; }
  },
  bidIncrement: {
    type: Number,
    required: [true, 'Bid increment is required'],
    min: [1, 'Bid increment must be at least ₦1'],
    default: 100 // Default ₦100 increment
  },
  // Auction timing
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(v) {
        return v >= new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled'],
    default: 'draft'
  },
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  // Bidding information
  totalBids: {
    type: Number,
    default: 0
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  }],
  // Winner information
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  finalPrice: {
    type: Number,
    default: null
  },
  // Media
  images: [{
    url: String,
    filename: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    url: String,
    filename: String,
    thumbnail: String
  }],
  // Auction type
  auctionType: {
    type: String,
    enum: ['regular', 'reserve', 'buy_now'],
    default: 'regular'
  },
  // Features
  features: [{
    name: String,
    value: String
  }],
  // Location
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'Nigeria'
    }
  },
  // Shipping
  shipping: {
    available: {
      type: Boolean,
      default: false
    },
    cost: {
      type: Number,
      default: 0
    },
    methods: [String]
  },
  // Auto-extend feature
  autoExtend: {
    enabled: {
      type: Boolean,
      default: false
    },
    timeExtension: {
      type: Number,
      default: 300000 // 5 minutes in milliseconds
    }
  },
  // Watchers
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  watchCount: {
    type: Number,
    default: 0
  },
  // Views
  viewCount: {
    type: Number,
    default: 0
  },
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'failed'],
    default: 'pending'
  },
  // Admin notes
  adminNotes: {
    type: String,
    default: ''
  },
  // Featured auction
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auctionSchema.index({ status: 1, endDate: 1 });
auctionSchema.index({ seller: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ startDate: 1, endDate: 1 });
auctionSchema.index({ title: 'text', description: 'text' });
auctionSchema.index({ currentPrice: 1 });
auctionSchema.index({ createdAt: -1 });

// Virtual for auction duration in hours
auctionSchema.virtual('durationHours').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60));
});

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now >= this.endDate) return 0;
  return this.endDate - now;
});

// Virtual for time remaining formatted
auctionSchema.virtual('timeRemainingFormatted').get(function() {
  const remaining = this.timeRemaining;
  if (remaining <= 0) return 'Ended';
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Virtual for main image
auctionSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg || this.images[0] || null;
});

// Virtual for reserve met status
auctionSchema.virtual('reserveMet').get(function() {
  if (!this.reservePrice) return true; // No reserve price means always met
  return this.currentPrice >= this.reservePrice;
});

// Virtual for can buy now
auctionSchema.virtual('canBuyNow').get(function() {
  return this.buyItNowPrice && this.status === 'active' && !this.winner;
});

// Pre-save middleware to update status based on dates
auctionSchema.pre('save', function(next) {
  const now = new Date();
  
  // Update status based on dates
  if (this.status === 'scheduled' && now >= this.startDate) {
    this.status = 'active';
  }
  
  if (this.status === 'active' && now >= this.endDate) {
    this.status = 'ended';
  }
  
  // Set auction type based on pricing
  if (this.buyItNowPrice && this.reservePrice) {
    this.auctionType = 'buy_now';
  } else if (this.reservePrice) {
    this.auctionType = 'reserve';
  } else {
    this.auctionType = 'regular';
  }
  
  next();
});

// Instance method to check if auction is active
auctionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now < this.endDate;
};

// Instance method to check if auction can accept bids
auctionSchema.methods.canAcceptBids = function() {
  return this.isActive() && !this.winner;
};

// Instance method to get next minimum bid
auctionSchema.methods.getNextMinimumBid = function() {
  return this.currentPrice + this.bidIncrement;
};

// Instance method to add watcher
auctionSchema.methods.addWatcher = function(userId) {
  if (!this.watchers.includes(userId)) {
    this.watchers.push(userId);
    this.watchCount = this.watchers.length;
  }
};

// Instance method to remove watcher
auctionSchema.methods.removeWatcher = function(userId) {
  this.watchers = this.watchers.filter(id => id.toString() !== userId.toString());
  this.watchCount = this.watchers.length;
};

// Instance method to increment view count
auctionSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to find active auctions
auctionSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gt: now }
  });
};

// Static method to find ending soon auctions
auctionSchema.statics.findEndingSoon = function(hours = 24) {
  const now = new Date();
  const endTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
  
  return this.find({
    status: 'active',
    endDate: { $gt: now, $lte: endTime }
  }).sort({ endDate: 1 });
};

// Static method to find featured auctions
auctionSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, status: { $in: ['active', 'scheduled'] } });
};

// Static method to search auctions
auctionSchema.statics.searchAuctions = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: { $in: ['active', 'scheduled'] },
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Auction', auctionSchema);

