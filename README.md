# NAuction - Online Auction Platform

NAuction is a comprehensive MERN Stack auction application built for the Nigerian market. It provides a secure, transparent, and user-friendly platform for online auctions with features like real-time bidding, auto-bidding, currency conversion, and admin management.

## 🚀 Features

### User Features
- **User Authentication**: Secure registration and login system with JWT tokens
- **Real-time Bidding**: Place bids on auctions with real-time updates
- **Auto-bidding**: Set maximum bid amounts for automatic bidding
- **Buy It Now**: Purchase items immediately at fixed prices
- **Balance Management**: Secure account balance system with 20% bid requirement
- **Watchlist**: Save favorite auctions for easy tracking
- **Currency Display**: Dual currency display (NGN/USD) with live exchange rates
- **Profile Management**: Update personal information and view bidding history

### Admin Features
- **Admin Dashboard**: Comprehensive dashboard with system statistics
- **User Management**: Manage user accounts, roles, and balances
- **Auction Management**: Create, edit, and manage auctions
- **System Settings**: Configure platform settings and exchange rates
- **Financial Reports**: Track revenue and transaction analytics

### Technical Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **File Upload**: Support for image and video uploads
- **Search & Filter**: Advanced search with category and price filters
- **Security**: Password hashing, JWT authentication, rate limiting
- **API Documentation**: RESTful API with comprehensive endpoints

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Axios** - HTTP client for external APIs

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **Lucide React** - Icon library
- **React Router** - Client-side routing
- **Context API** - State management

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or pnpm package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nauction
JWT_SECRET=your_jwt_secret_key_here
EXCHANGE_API_KEY=your_exchange_rate_api_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
WHATSAPP_API_URL=your_whatsapp_api_url
```

4. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `EXCHANGE_API_KEY`: API key for currency exchange rates
- `EMAIL_*`: Email service configuration for notifications
- `WHATSAPP_API_URL`: WhatsApp API endpoint for notifications

#### Frontend
The frontend automatically connects to the backend API. Update the API base URL in `src/services/api.js` if needed.

## 🎯 Usage

### For Users

1. **Registration**: Create an account with name, email, and password
2. **Login**: Sign in to access bidding features
3. **Browse Auctions**: View available auctions with search and filters
4. **Place Bids**: Bid on items (requires 20% of bid amount in balance)
5. **Auto-bidding**: Set maximum bid amounts for automatic bidding
6. **Buy It Now**: Purchase items immediately at fixed prices
7. **Profile Management**: Update information and view bidding history

### For Administrators

1. **Admin Login**: Use admin credentials to access admin features
2. **Dashboard**: View system statistics and recent activity
3. **User Management**: Manage user accounts and balances
4. **Auction Management**: Create and manage auctions
5. **System Settings**: Configure platform settings

### Demo Accounts

**Admin Account:**
- Email: admin@nauction.com
- Password: admin123

**Regular User:**
- Register a new account or use the admin panel to create test users

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Auction Endpoints
- `GET /api/auctions` - Get all auctions (with filters)
- `GET /api/auctions/:id` - Get single auction
- `POST /api/auctions` - Create auction (admin only)
- `PUT /api/auctions/:id` - Update auction (admin only)
- `DELETE /api/auctions/:id` - Delete auction (admin only)

### Bidding Endpoints
- `POST /api/bids` - Place a bid
- `GET /api/bids/auction/:auctionId` - Get bid history
- `GET /api/bids/user/my-bids` - Get user's bids

### User Management (Admin)
- `GET /api/users` - Get all users
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/balance` - Update user balance
- `PUT /api/users/:id/status` - Update user status

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **File Upload Security**: Secure file upload with type validation

## 💰 Business Logic

### Bidding System
- Users must have at least 20% of the bid amount in their account balance
- Winning bidders must pay the remaining 80% within the specified timeframe
- Failure to pay results in a 10% penalty deducted from the account balance
- Auto-bidding system automatically places bids up to the user's maximum amount

### Currency System
- Primary currency: Nigerian Naira (NGN)
- Secondary display: US Dollar (USD)
- Live exchange rate conversion
- Admin can update exchange rates manually

### Admin Controls
- Create and manage auctions
- Set bid increments and reserve prices
- Manage user accounts and balances
- Configure system settings

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables for production
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Ensure the server listens on `0.0.0.0` for external access

### Frontend Deployment
1. Build the production version:
```bash
pnpm run build
```

2. Deploy the `dist` folder to platforms like:
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

### Full-Stack Deployment
For a complete deployment, you can use platforms like:
- Railway (supports both frontend and backend)
- Heroku (with separate apps for frontend and backend)
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@nauction.com or join our WhatsApp group.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading auction platforms
- Designed for the Nigerian market
- Community-driven development

## 📊 Project Structure

```
nauction/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── uploads/            # File upload directory
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── index.html          # Main HTML file
└── README.md               # Project documentation
```

## 🔄 Development Workflow

1. **Backend Development**: Start with API endpoints and database models
2. **Frontend Development**: Build React components and pages
3. **Integration**: Connect frontend to backend APIs
4. **Testing**: Test all features and fix bugs
5. **Deployment**: Deploy to production environment

## 📈 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Mobile app development (React Native)
- [ ] Payment gateway integration
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Social media integration
- [ ] Advanced search with Elasticsearch
- [ ] Automated testing suite

---

**NAuction** - Empowering online auctions in Nigeria 🇳🇬

