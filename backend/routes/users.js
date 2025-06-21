const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireAdminAuth } = require('../middleware/adminAuth');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      address 
    } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get user balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ message: 'Error fetching balance', error: error.message });
  }
});

// Admin: Search users
router.get('/admin/search', requireAdminAuth, async (req, res) => {
  try {
    const { 
      q, 
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    let searchQuery = {};

    // Text search across username, email, firstName, lastName
    if (q) {
      searchQuery.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      searchQuery.role = role;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute search
    const users = await User.find(searchQuery)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Admin: Update user balance
router.put('/admin/balance/:userId', requireAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance, action = 'set' } = req.body; // action can be 'set', 'add', or 'subtract'

    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ message: 'Invalid balance amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let newBalance;
    switch (action) {
      case 'add':
        newBalance = user.balance + balance;
        break;
      case 'subtract':
        newBalance = Math.max(0, user.balance - balance); // Don't allow negative balance
        break;
      case 'set':
      default:
        newBalance = balance;
        break;
    }

    user.balance = newBalance;
    await user.save();

    res.json({
      message: 'Balance updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Balance update error:', error);
    res.status(500).json({ message: 'Error updating balance', error: error.message });
  }
});

// Admin: Update user role
router.put('/admin/role/:userId', requireAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Role updated successfully',
      user
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

module.exports = router;

