const Auction = require('../models/Auction');
const User = require('../models/User');

class SearchService {
  constructor() {
    this.defaultLimit = 20;
    this.maxLimit = 100;
  }

  // Search auctions with advanced filtering
  async searchAuctions(query, options = {}) {
    const {
      page = 1,
      limit = this.defaultLimit,
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      status = 'active',
      sortBy = 'relevance',
      sortOrder = 'desc',
      featured,
      endingSoon,
      hasReserve,
      hasBuyNow
    } = options;

    // Build search query
    const searchQuery = this.buildAuctionSearchQuery(query, {
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      status,
      featured,
      endingSoon,
      hasReserve,
      hasBuyNow
    });

    // Build sort options
    const sortOptions = this.buildSortOptions(sortBy, sortOrder, !!query);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), this.maxLimit);

    try {
      // Execute search
      const auctions = await Auction.find(searchQuery)
        .populate('seller', 'name')
        .populate('highestBidder', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-adminNotes');

      // Get total count for pagination
      const totalCount = await Auction.countDocuments(searchQuery);

      // Add computed fields
      const auctionsWithExtras = auctions.map(auction => {
        const auctionObj = auction.toObject();
        auctionObj.timeRemaining = auction.timeRemaining;
        auctionObj.timeRemainingFormatted = auction.timeRemainingFormatted;
        auctionObj.canBuyNow = auction.canBuyNow;
        auctionObj.reserveMet = auction.reserveMet;
        auctionObj.nextMinimumBid = auction.getNextMinimumBid();
        return auctionObj;
      });

      return {
        auctions: auctionsWithExtras,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limitNum),
          totalResults: totalCount,
          hasNext: page < Math.ceil(totalCount / limitNum),
          hasPrev: page > 1,
          limit: limitNum
        },
        searchInfo: {
          query,
          filters: {
            category,
            minPrice,
            maxPrice,
            condition,
            location,
            status,
            featured,
            endingSoon,
            hasReserve,
            hasBuyNow
          },
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Build MongoDB query for auction search
  buildAuctionSearchQuery(searchTerm, filters) {
    const query = {};

    // Text search
    if (searchTerm && searchTerm.trim()) {
      const searchRegex = new RegExp(searchTerm.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
        { 'features.name': searchRegex },
        { 'features.value': searchRegex }
      ];
    }

    // Status filter
    if (filters.status === 'active') {
      const now = new Date();
      query.status = 'active';
      query.startDate = { $lte: now };
      query.endDate = { $gt: now };
    } else if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      query.currentPrice = {};
      if (filters.minPrice) query.currentPrice.$gte = parseInt(filters.minPrice);
      if (filters.maxPrice) query.currentPrice.$lte = parseInt(filters.maxPrice);
    }

    // Condition filter
    if (filters.condition && filters.condition !== 'all') {
      query.condition = filters.condition;
    }

    // Location filter
    if (filters.location) {
      const locationRegex = new RegExp(filters.location, 'i');
      query.$or = query.$or || [];
      query.$or.push(
        { 'location.city': locationRegex },
        { 'location.state': locationRegex }
      );
    }

    // Featured filter
    if (filters.featured === 'true') {
      query.isFeatured = true;
    }

    // Ending soon filter
    if (filters.endingSoon === 'true') {
      const now = new Date();
      const endingSoonTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      query.endDate = { $gt: now, $lte: endingSoonTime };
    }

    // Reserve price filter
    if (filters.hasReserve === 'true') {
      query.reservePrice = { $exists: true, $ne: null, $gt: 0 };
    } else if (filters.hasReserve === 'false') {
      query.$or = [
        { reservePrice: { $exists: false } },
        { reservePrice: null },
        { reservePrice: 0 }
      ];
    }

    // Buy now filter
    if (filters.hasBuyNow === 'true') {
      query.buyItNowPrice = { $exists: true, $ne: null, $gt: 0 };
    } else if (filters.hasBuyNow === 'false') {
      query.$or = [
        { buyItNowPrice: { $exists: false } },
        { buyItNowPrice: null },
        { buyItNowPrice: 0 }
      ];
    }

    return query;
  }

  // Build sort options
  buildSortOptions(sortBy, sortOrder, hasTextSearch) {
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'price':
        return { currentPrice: order };
      case 'endDate':
        return { endDate: order };
      case 'startDate':
        return { startDate: order };
      case 'bids':
        return { totalBids: order };
      case 'views':
        return { viewCount: order };
      case 'created':
        return { createdAt: order };
      case 'relevance':
      default:
        if (hasTextSearch) {
          return { score: { $meta: 'textScore' }, createdAt: -1 };
        }
        return { createdAt: -1 };
    }
  }

  // Search users (admin only)
  async searchUsers(query, options = {}) {
    const {
      page = 1,
      limit = this.defaultLimit,
      role,
      isActive,
      sortBy = 'created',
      sortOrder = 'desc'
    } = options;

    const searchQuery = {};

    // Text search
    if (query && query.trim()) {
      const searchRegex = new RegExp(query.trim(), 'i');
      searchQuery.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      searchQuery.role = role;
    }

    // Active status filter
    if (isActive !== undefined) {
      searchQuery.isActive = isActive === 'true';
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions.name = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'email':
        sortOptions.email = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'balance':
        sortOptions.balance = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'created':
      default:
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), this.maxLimit);

    try {
      const users = await User.find(searchQuery)
        .select('-password -loginAttempts -lockUntil')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

      const totalCount = await User.countDocuments(searchQuery);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limitNum),
          totalResults: totalCount,
          hasNext: page < Math.ceil(totalCount / limitNum),
          hasPrev: page > 1,
          limit: limitNum
        },
        searchInfo: {
          query,
          filters: { role, isActive },
          sortBy,
          sortOrder
        }
      };
    } catch (error) {
      throw new Error(`User search failed: ${error.message}`);
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const searchRegex = new RegExp(query, 'i');
    
    try {
      // Get suggestions from auction titles and brands
      const suggestions = await Auction.aggregate([
        {
          $match: {
            status: { $in: ['active', 'scheduled'] },
            $or: [
              { title: searchRegex },
              { brand: searchRegex },
              { category: searchRegex }
            ]
          }
        },
        {
          $project: {
            suggestions: [
              '$title',
              '$brand',
              '$category'
            ]
          }
        },
        {
          $unwind: '$suggestions'
        },
        {
          $match: {
            suggestions: searchRegex
          }
        },
        {
          $group: {
            _id: '$suggestions',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return suggestions.map(s => ({
        text: s._id,
        count: s.count
      }));
    } catch (error) {
      console.error('Get search suggestions error:', error);
      return [];
    }
  }

  // Get popular searches
  async getPopularSearches(limit = 10) {
    try {
      // This would typically come from search analytics
      // For now, return popular categories and brands
      const popular = await Auction.aggregate([
        {
          $match: {
            status: { $in: ['active', 'scheduled'] }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return popular.map(p => ({
        text: p._id,
        count: p.count,
        type: 'category'
      }));
    } catch (error) {
      console.error('Get popular searches error:', error);
      return [];
    }
  }
}

module.exports = new SearchService();

