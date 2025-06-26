const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({ 
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Admin access required',
      error: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserIdField] || 
                          req.params[resourceUserIdField] || 
                          req.query[resourceUserIdField];

    if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied. You can only access your own resources.',
      error: 'ACCESS_DENIED'
    });
  };
};

// Middleware to validate user account balance for bidding
const validateBiddingBalance = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      });
    }

    const { bidAmount } = req.body;
    
    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({ 
        message: 'Valid bid amount is required',
        error: 'INVALID_BID_AMOUNT'
      });
    }

    // Check if user has at least 20% of bid amount in balance
    const requiredBalance = bidAmount * 0.2;
    
    if (req.user.balance < requiredBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. You need at least ₦${requiredBalance.toLocaleString()} (20% of bid amount) to place this bid.`,
        error: 'INSUFFICIENT_BALANCE',
        requiredBalance,
        currentBalance: req.user.balance
      });
    }

    next();
  } catch (error) {
    console.error('Balance validation error:', error);
    res.status(500).json({ 
      message: 'Balance validation failed',
      error: 'VALIDATION_ERROR'
    });
  }
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    req.user = user && user.isActive ? user : null;
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  validateBiddingBalance,
  optionalAuth
};

