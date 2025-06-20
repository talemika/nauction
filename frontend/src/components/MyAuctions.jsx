import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auctionsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Clock, DollarSign, Eye, Plus } from 'lucide-react';

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyAuctions();
  }, [isAuthenticated, navigate]);

  const fetchMyAuctions = async () => {
    try {
      setLoading(true);
      const response = await auctionsAPI.getUserAuctions();
      setAuctions(response.data);
    } catch (err) {
      setError('Failed to fetch your auctions');
      console.error('Error fetching user auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'ended':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading your auctions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Auctions</h1>
          <p className="text-muted-foreground">Manage your auction listings</p>
        </div>
        <Button asChild>
          <Link to="/create-auction" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create New Auction</span>
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Auctions Grid */}
      {auctions.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-muted-foreground">No auctions yet</h2>
          <p className="text-muted-foreground mt-2 mb-4">
            Start by creating your first auction
          </p>
          <Button asChild>
            <Link to="/create-auction">Create Auction</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <Card key={auction._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{auction.title}</CardTitle>
                  <Badge variant={getStatusVariant(auction.status)}>
                    {auction.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Image placeholder */}
                <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                  {auction.imageUrl ? (
                    <img 
                      src={auction.imageUrl} 
                      alt={auction.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="text-muted-foreground">No Image</div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {auction.description}
                </p>

                {/* Auction Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Starting Price</div>
                    <div className="font-medium">{formatPrice(auction.startingPrice)}</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Current Price</div>
                    <div className="font-semibold text-green-600">
                      {formatPrice(auction.currentPrice)}
                    </div>
                  </div>

                  {auction.status === 'active' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Time Left</span>
                      </div>
                      <div className="font-medium">
                        {formatTimeRemaining(auction.endTime)}
                      </div>
                    </div>
                  )}

                  {auction.status === 'ended' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Final Price</div>
                        <div className="font-semibold text-green-600">
                          {formatPrice(auction.currentPrice)}
                        </div>
                      </div>
                      {auction.winner && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">Winner</div>
                          <div className="font-medium">{auction.winner.username}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="text-sm">{formatDate(auction.createdAt)}</div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex space-x-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/auction/${auction._id}`} className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                </Button>
                
                {auction.status === 'active' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      // TODO: Implement cancel auction functionality
                      console.log('Cancel auction:', auction._id);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAuctions;

