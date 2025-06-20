import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { bidsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Clock, DollarSign, Eye, TrendingUp, Trophy } from 'lucide-react';

const MyBids = () => {
  const [bids, setBids] = useState([]);
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
    fetchMyBids();
  }, [isAuthenticated, navigate]);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      const response = await bidsAPI.getUserBids();
      setBids(response.data);
    } catch (err) {
      setError('Failed to fetch your bids');
      console.error('Error fetching user bids:', err);
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString();
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

  const isWinningBid = (bid) => {
    return bid.auction.status === 'ended' && bid.amount === bid.auction.currentPrice;
  };

  const isCurrentHighestBid = (bid) => {
    return bid.auction.status === 'active' && bid.amount === bid.auction.currentPrice;
  };

  // Group bids by auction
  const groupedBids = bids.reduce((acc, bid) => {
    const auctionId = bid.auction._id;
    if (!acc[auctionId]) {
      acc[auctionId] = {
        auction: bid.auction,
        bids: [],
        highestBid: bid,
      };
    }
    acc[auctionId].bids.push(bid);
    
    // Update highest bid if this bid is higher
    if (bid.amount > acc[auctionId].highestBid.amount) {
      acc[auctionId].highestBid = bid;
    }
    
    return acc;
  }, {});

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading your bids...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Bids</h1>
        <p className="text-muted-foreground">Track your bidding activity and results</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Bids Grid */}
      {Object.keys(groupedBids).length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-muted-foreground">No bids yet</h2>
          <p className="text-muted-foreground mt-2 mb-4">
            Start bidding on auctions to see your activity here
          </p>
          <Button asChild>
            <Link to="/">Browse Auctions</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.values(groupedBids).map(({ auction, bids: auctionBids, highestBid }) => (
            <Card key={auction._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{auction.title}</CardTitle>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={getStatusVariant(auction.status)}>
                      {auction.status}
                    </Badge>
                    {isWinningBid(highestBid) && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Won!
                      </Badge>
                    )}
                    {isCurrentHighestBid(highestBid) && auction.status === 'active' && (
                      <Badge variant="default" className="bg-green-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Leading
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Auction Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Current Price</div>
                    <div className="font-semibold text-green-600">
                      {formatPrice(auction.currentPrice)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Your Highest Bid</div>
                    <div className="font-semibold text-blue-600">
                      {formatPrice(highestBid.amount)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Total Bids</div>
                    <div className="font-medium">{auctionBids.length}</div>
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

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Last Bid</div>
                    <div className="text-sm">{formatDateTime(highestBid.timestamp)}</div>
                  </div>
                </div>

                {/* Bid History */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Your Bid History</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {auctionBids
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((bid, index) => (
                        <div key={bid._id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span className="font-medium">{formatPrice(bid.amount)}</span>
                          <span className="text-muted-foreground">
                            {formatDateTime(bid.timestamp)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/auction/${auction._id}`} className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>View Auction</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBids;

