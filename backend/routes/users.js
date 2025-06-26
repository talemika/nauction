const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    
    const query = {};
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role) {
      query.role = role;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password -loginAttempts -lockUntil'
    };

    const users = await User.find(query)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to retrieve users',
      error: 'FETCH_USERS_ERROR'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Own profile or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is accessing their own profile or is admin
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    const user = await User.findById(id)
      .select('-password -loginAttempts -lockUntil')
      .populate('bids')
      .populate('wonAuctions');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user',
      error: 'FETCH_USER_ERROR'
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Valid role (user or admin) is required',
        error: 'INVALID_ROLE'
      });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'You cannot change your own role',
        error: 'SELF_ROLE_CHANGE'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      message: 'Failed to update user role',
      error: 'UPDATE_ROLE_ERROR'
    });
  }
});

// @route   PUT /api/users/:id/balance
// @desc    Update user balance (Admin only)
// @access  Private/Admin
router.put('/:id/balance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { balance, operation = 'set' } = req.body;

    if (balance === undefined || balance < 0) {
      return res.status(400).json({
        message: 'Valid balance amount is required (must be >= 0)',
        error: 'INVALID_BALANCE'
      });
    }

    if (!['set', 'add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        message: 'Operation must be one of: set, add, subtract',
        error: 'INVALID_OPERATION'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    let newBalance;
    switch (operation) {
      case 'set':
        newBalance = balance;
        break;
      case 'add':
        newBalance = user.balance + balance;
        break;
      case 'subtract':
        newBalance = Math.max(0, user.balance - balance); // Don't allow negative balance
        break;
    }

    user.balance = newBalance;
    await user.save();

    res.json({
      message: `User balance ${operation === 'set' ? 'set to' : operation === 'add' ? 'increased by' : 'decreased by'} ₦${balance.toLocaleString()} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        previousBalance: operation === 'set' ? null : (operation === 'add' ? user.balance - balance : user.balance + balance)
      }
    });
  } catch (error) {
    console.error('Update user balance error:', error);
    res.status(500).json({
      message: 'Failed to update user balance',
      error: 'UPDATE_BALANCE_ERROR'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Activate/Deactivate user account (Admin only)
// @access  Private/Admin
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be a boolean value',
        error: 'INVALID_STATUS'
      });
    }

    // Prevent admin from deactivating their own account
    if (req.user._id.toString() === id && !isActive) {
      return res.status(400).json({
        message: 'You cannot deactivate your own account',
        error: 'SELF_DEACTIVATION'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      error: 'UPDATE_STATUS_ERROR'
    });
  }
});

// @route   GET /api/users/search/:term
// @desc    Search users by name or email (Admin only)
// @access  Private/Admin
router.get('/search/:term', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;

    if (!term || term.length < 2) {
      return res.status(400).json({
        message: 'Search term must be at least 2 characters long',
        error: 'INVALID_SEARCH_TERM'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ]
    })
    .select('-password -loginAttempts -lockUntil')
    .limit(parseInt(limit))
    .sort({ name: 1 });

    res.json({
      message: 'Search completed successfully',
      users,
      searchTerm: term,
      count: users.length
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      message: 'Search failed',
      error: 'SEARCH_ERROR'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user account (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: 'You cannot delete your own account',
        error: 'SELF_DELETION'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user has active bids or won auctions
    if (user.bids.length > 0 || user.wonAuctions.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete user with active bids or won auctions. Deactivate account instead.',
        error: 'USER_HAS_ACTIVITY'
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'User account deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Failed to delete user',
      error: 'DELETE_USER_ERROR'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview (Admin only)
// @access  Private/Admin
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    // Users registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Total balance across all users
    const balanceStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          averageBalance: { $avg: '$balance' },
          maxBalance: { $max: '$balance' },
          minBalance: { $min: '$balance' }
        }
      }
    ]);

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        newUsersLast30Days: newUsers,
        balanceStats: balanceStats[0] || {
          totalBalance: 0,
          averageBalance: 0,
          maxBalance: 0,
          minBalance: 0
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user statistics',
      error: 'STATS_ERROR'
    });
  }
});

module.exports = router;

