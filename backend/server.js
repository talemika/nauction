const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nauction';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  // Create default admin user after connection
  createDefaultAdmin();
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NAuction API is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Create default admin user
async function createDefaultAdmin() {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await User.findOne({ email: 'admin@mail.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin@1234', 12);
      const adminUser = new User({
        name: 'admin',
        email: 'admin@mail.com',
        password: hashedPassword,
        role: 'admin',
        balance: 1000000, // 1 million Naira default balance
        isVerified: true
      });
      
      await adminUser.save();
      console.log('Default admin user created successfully');
    } else {
      console.log('Default admin user already exists');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

