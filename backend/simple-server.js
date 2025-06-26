const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nauction';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Basic User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Basic Auction model
const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startingPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  bidIncrement: { type: Number, default: 100 },
  buyItNowPrice: { type: Number },
  endTime: { type: Date, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  featured: { type: Boolean, default: false },
  totalBids: { type: Number, default: 0 },
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Add virtual for timeRemaining
auctionSchema.virtual('timeRemaining').get(function() {
  return this.endTime - new Date();
});

auctionSchema.set('toJSON', { virtuals: true });

const Auction = mongoose.model('Auction', auctionSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NAuction API is running' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get auctions
app.get('/api/auctions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = 'endTime',
      order = 'asc',
    } = req.query;

    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sort] = sortOrder;

    const auctions = await Auction.find(query)
      .populate('seller', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Auction.countDocuments(query);

    res.json({
      auctions,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single auction
app.get('/api/auctions/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json({ auction });
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create sample data
app.post('/api/admin/create-sample-data', async (req, res) => {
  try {
    // Create admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@nauction.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@nauction.com',
        password: hashedPassword,
        role: 'admin',
        balance: 1000000,
      });
      await adminUser.save();
    }

    // Create sample auctions
    const sampleAuctions = [
      {
        title: 'Vintage Rolex Watch',
        description: 'A beautiful vintage Rolex watch in excellent condition.',
        category: 'Fashion',
        startingPrice: 50000,
        currentPrice: 50000,
        bidIncrement: 5000,
        buyItNowPrice: 200000,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        seller: adminUser._id,
        featured: true,
      },
      {
        title: 'iPhone 15 Pro Max',
        description: 'Brand new iPhone 15 Pro Max, 256GB, Space Black.',
        category: 'Electronics',
        startingPrice: 100000,
        currentPrice: 100000,
        bidIncrement: 10000,
        buyItNowPrice: 450000,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        seller: adminUser._id,
        featured: true,
      },
      {
        title: 'Gaming Laptop',
        description: 'High-performance gaming laptop with RTX 4080.',
        category: 'Electronics',
        startingPrice: 200000,
        currentPrice: 200000,
        bidIncrement: 15000,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        seller: adminUser._id,
      }
    ];

    for (const auctionData of sampleAuctions) {
      const existingAuction = await Auction.findOne({ title: auctionData.title });
      if (!existingAuction) {
        const auction = new Auction(auctionData);
        await auction.save();
      }
    }

    res.json({ message: 'Sample data created successfully' });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NAuction API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

