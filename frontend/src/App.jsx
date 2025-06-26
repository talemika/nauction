import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Auctions from './pages/Auctions';
import AuctionDetail from './pages/AuctionDetail';
import AdminDashboard from './pages/AdminDashboard';
import BiddingInfo from './pages/BiddingInfo';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <Router>
            <div className="min-h-screen bg-background flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auctions" element={<Auctions />} />
                  <Route path="/auctions/:id" element={<AuctionDetail />} />
                  <Route path="/bidding-info" element={<BiddingInfo />} />
                  
                  {/* Protected routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin/*" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

