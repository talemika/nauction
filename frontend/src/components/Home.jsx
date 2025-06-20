import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useCurrency } from '../hooks/useCurrency';
import SearchComponent from './SearchComponent';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, DollarSign, User, Tag, Package } from 'lucide-react';

const Home = () => {
  const [auctions, setAuctions] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { displayAmount } = useCurrency();

  useEffect(() => {
    if (!isSearchMode) {
      fetchAuctions();
    }
  }, [isSearchMode]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auctions');
      setAuctions(response.data);
      setIsSearchMode(false);
    } catch (err) {
      setError('Failed to fetch auctions');
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (results) => {
    setAuctions(results.auctions);
    setPagination(results.pagination);
    setIsSearchMode(true);
    setError(null);
  };

  const handleSearchLoading = (loading) => {
    setSearchLoading(loading);
  };

  const loadMoreResults = async (page) => {
    // This would be called from pagination controls
    // Implementation depends on how SearchComponent exposes search parameters
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

  const formatPrice = (price, currency = 'NGN') => {
    return displayAmount(price, currency);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading auctions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Welcome to Auction House</h1>
        <p className="text-lg text-muted-foreground">
          Discover amazing items and place your bids on active auctions
        </p>
      </div>

      {/* Search Component */}
      <SearchComponent 
        onResults={handleSearchResults}
        onLoading={handleSearchLoading}
      />

      {/* Results Header */}
      {isSearchMode && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Search Results</h2>
            <p className="text-muted-foreground">
              {pagination.total} auction{pagination.total !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchAuctions}
            className="text-sm"
          >
            View All Auctions
          </Button>
        </div>
      )}

      {/* Loading State */}
      {(loading || searchLoading) && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading auctions...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && !searchLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-destructive">{error}</div>
        </div>
      )}

      {/* Auctions Grid */}
      {!loading && !searchLoading && auctions.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-muted-foreground">
            {isSearchMode ? 'No auctions found' : 'No active auctions'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isSearchMode ? 'Try adjusting your search criteria' : 'Check back later for new items!'}
          </p>
        </div>
      )}

      {!loading && !searchLoading && auctions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <Card key={auction._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{auction.title}</CardTitle>
                  <Badge variant={auction.status === 'active' ? 'default' : 'secondary'}>
                    {auction.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Media placeholder */}
                <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {auction.media && auction.media.length > 0 ? (
                    auction.media[0].type === 'image' ? (
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${auction.media[0].url}`}
                        alt={auction.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video 
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${auction.media[0].url}`}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )
                  ) : (
                    <div className="text-muted-foreground">No Media</div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {auction.description}
                </p>

                {/* Category and Condition */}
                {(auction.category || auction.condition) && (
                  <div className="flex flex-wrap gap-2">
                    {auction.category && (
                      <div className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        <Package className="h-3 w-3" />
                        <span>{auction.category}</span>
                      </div>
                    )}
                    {auction.condition && (
                      <div className="flex items-center space-x-1 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        <span className="capitalize">{auction.condition}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {auction.tags && auction.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {auction.tags.slice(0, 3).map((tag, index) => (
                      <div key={index} className="flex items-center space-x-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        <Tag className="h-3 w-3" />
                        <span>{tag}</span>
                      </div>
                    ))}
                    {auction.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{auction.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Price and Time */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatPrice(auction.currentPrice, auction.currency)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeRemaining(auction.endTime)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Seller: {auction.seller?.username}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/auction/${auction._id}`}>
                    View Details & Bid
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {isSearchMode && pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            disabled={pagination.current === 1}
            onClick={() => loadMoreResults(pagination.current - 1)}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <Button
            variant="outline"
            disabled={pagination.current === pagination.pages}
            onClick={() => loadMoreResults(pagination.current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Home;

