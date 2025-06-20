import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Gavel, User, Plus, List, TrendingUp, Shield } from 'lucide-react';
import CurrencySelector from './CurrencySelector';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary">
            <Gavel className="h-6 w-6" />
            <span>Auction House</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link to="/create-auction" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Create Auction</span>
                </Link>
                <Link to="/admin" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </>
            )}
            {isAuthenticated && (
              <>
                <Link to="/my-auctions" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                  <List className="h-4 w-4" />
                  <span>My Auctions</span>
                </Link>
                <Link to="/my-bids" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                  <TrendingUp className="h-4 w-4" />
                  <span>My Bids</span>
                </Link>
              </>
            )}
          </div>

          {/* Currency Selector and Auth Buttons */}
          <div className="flex items-center space-x-4">
            <CurrencySelector />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <Link to="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                    {user?.username}
                  </Link>
                  {user?.role === 'admin' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

