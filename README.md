# MERN Stack Auction Application - Enhanced Edition

A full-stack auction application built with MongoDB, Express.js, React, and Node.js, featuring **admin-only auction creation** and **file/video upload functionality**.

## 🚀 Live Application

- **Frontend**: https://zumfatbz.manus.space
- **Backend API**: https://5000-iduc8ewoq8fsopbei8fnp-ca6f11b9.manusvm.computer

## ✨ New Features

### 🔐 Admin-Only Auction Creation
- **Role-based Access Control**: Only users with admin role can create new auctions
- **Secure Authentication**: JWT tokens include user roles for proper authorization
- **UI Restrictions**: "Create Auction" button only visible to admin users
- **Backend Enforcement**: API endpoints protected with admin middleware

### 📁 File & Video Upload System
- **Multi-Media Support**: Upload images and videos for auction items
- **File Size Limits**: Maximum 50MB per file for optimal performance
- **Multiple Files**: Support for multiple media files per auction
- **Media Display**: Uploaded files displayed in auction listings and detail pages
- **Secure Storage**: Files stored securely on the server with proper validation

## 🏗️ Architecture

### Backend (Node.js + Express.js)
```
backend/
├── models/
│   ├── User.js          # User model with role field
│   ├── Auction.js       # Auction model with media array
│   └── Bid.js          # Bid model
├── routes/
│   ├── auth.js         # Authentication with role support
│   ├── auctions.js     # Admin-protected auction routes
│   ├── bids.js         # Bidding functionality
│   └── upload.js       # File upload endpoints
├── middleware/
│   └── adminAuth.js    # Admin role verification
├── uploads/            # File storage directory
└── server.js          # Main server file
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx        # Role-based navigation
│   │   ├── Home.jsx          # Auction listings with media
│   │   ├── CreateAuction.jsx # Admin-only auction creation
│   │   ├── AuctionDetail.jsx # Media gallery display
│   │   ├── Login.jsx         # User authentication
│   │   └── Register.jsx      # User registration
│   ├── hooks/
│   │   └── useAuth.jsx       # Authentication context with roles
│   └── lib/
│       └── api.js            # API service layer
```

## 🔧 Technical Features

### User Management
- **Role System**: `user` (default) and `admin` roles
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Role-based access control
- **User Registration**: Automatic role assignment

### File Upload System
- **Multer Integration**: Robust file handling middleware
- **File Validation**: Type and size validation
- **Storage Management**: Organized file storage structure
- **Media Serving**: Static file serving for uploaded content

### Database Schema
```javascript
// User Model
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (enum: ['user', 'admin'], default: 'user')
}

// Auction Model
{
  title: String,
  description: String,
  startingPrice: Number,
  currentPrice: Number,
  duration: Number,
  media: [{
    url: String,
    type: String (enum: ['image', 'video']),
    filename: String
  }],
  seller: ObjectId,
  endTime: Date,
  status: String
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or pnpm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd auction-app
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Environment Configuration**
Create `.env` file in backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/auction-app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

4. **Frontend Setup**
```bash
cd ../frontend
pnpm install
```

5. **Start MongoDB**
```bash
sudo systemctl start mongod
```

6. **Run the Application**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
pnpm run dev
```

## 👥 User Roles & Permissions

### Regular Users (`user` role)
- ✅ Register and login
- ✅ View all auctions
- ✅ Place bids on auctions
- ✅ View their bidding history
- ❌ Cannot create new auctions

### Admin Users (`admin` role)
- ✅ All regular user permissions
- ✅ Create new auctions
- ✅ Upload media files for auctions
- ✅ Manage auction listings

### Creating Admin Users
To promote a user to admin role, use MongoDB:
```javascript
db.users.updateOne(
  {username: 'username'}, 
  {$set: {role: 'admin'}}
)
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Auctions (Admin Protected)
- `GET /api/auctions` - Get all auctions
- `POST /api/auctions` - Create auction (Admin only)
- `GET /api/auctions/:id` - Get auction details

### File Upload (Admin Protected)
- `POST /api/upload` - Upload media files (Admin only)

### Bidding
- `POST /api/bids` - Place a bid
- `GET /api/bids/auction/:id` - Get auction bids
- `GET /api/bids/user/:id` - Get user bids

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts

### Media Gallery
- Image and video preview
- Responsive media display
- File type indicators

### Role-Based UI
- Dynamic navigation based on user role
- Conditional component rendering
- Admin-specific features

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Secure authentication tokens
- **Role Validation**: Server-side role verification
- **File Validation**: Upload security and type checking
- **CORS Protection**: Cross-origin request security

## 🚀 Deployment

The application is deployed and ready for use:

- **Frontend**: React application with Vite build optimization
- **Backend**: Node.js server with Express.js framework
- **Database**: MongoDB for data persistence
- **File Storage**: Server-side file management

## 🛠️ Development

### Available Scripts

Backend:
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

Frontend:
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build

## 📝 Testing

The application has been thoroughly tested:

✅ User registration and authentication
✅ Role-based access control
✅ Admin-only auction creation
✅ File upload functionality
✅ Media display in auctions
✅ Bidding system
✅ Responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please refer to the documentation or create an issue in the repository.

---

**Built with ❤️ using the MERN Stack**

