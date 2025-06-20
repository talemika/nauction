const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { createDefaultAdmin } = require('./utils/createAdmin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  // Create default admin user after database connection
  await createDefaultAdmin();
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/search', require('./routes/search'));
app.use('/api/users', require('./routes/users'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Auction App API is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

