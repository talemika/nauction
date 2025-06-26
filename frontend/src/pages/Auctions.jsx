import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { auctionsAPI, searchAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Gavel, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Eye,
  Star,
  Timer,
  Loader2,
  SortAsc,
  SortDesc,
  Grid,
  List as ListIcon,
  Heart,
  ShoppingCart
} from 'lucide-react';

const Auctions = () => {
  const { isAuthenticated, user } = useAuth();
  const { formatDisplayAmount } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'endTime');
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'asc');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAuctions, setTotalAuctions] = useState(0);

  const itemsPerPage = 12;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [searchQuery, selectedCategory, sortBy, sortOrder, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await auctionsAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        order: sortOrder,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      // Handle special filters from URL params
      if (searchParams.get('featured') === 'true') {
        params.featured = true;
      }
      
      if (searchParams.get('endingSoon') === 'true') {
        params.endingSoon = true;
      }

      const response = await auctionsAPI.getAuctions(params);
      setAuctions(response.data.auctions || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalAuctions(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURLParams({ q: searchQuery, page: 1 });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateURLParams({ category, page: 1 });
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      updateURLParams({ order: newOrder });
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
      updateURLParams({ sort: newSortBy, order: 'asc' });
    }
  };

  const updateURLParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining <= 0) return 'Ended';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const AuctionCard = ({ auction, isListView = false }) => (
    <Card className={`group hover:shadow-lg transition-all cursor-pointer ${
      isListView ? 'flex flex-row' : ''
    }`}>
      <Link to={`/auctions/${auction._id}`} className={isListView ? 'flex w-full' : ''}>
        <div className={`${isListView ? 'w-48 flex-shrink-0' : 'w-full'}`}>
          <div className={`${
            isListView ? 'h-32' : 'aspect-video'
          } bg-muted rounded-lg flex items-center justify-center overflow-hidden ${
            isListView ? 'm-4' : 'mx-4 mt-4 mb-3'
          }`}>
            {auction.images && auction.images.length > 0 ? (
              <img 
                src={auction.mainImage?.url || auction.images[0]?.url} 
                alt={auction.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <Gavel className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <div className={`${isListView ? 'flex-1 p-4' : 'p-4 pt-0'}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {auction.category}
              </Badge>
              <div className="flex items-center gap-1">
                {auction.featured && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {auction.buyItNowPrice && (
                  <Badge variant="outline" className="text-xs">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Buy Now
                  </Badge>
                )}
              </div>
            </div>
            
            <CardTitle className={`${
              isListView ? 'text-lg' : 'text-lg'
            } line-clamp-2 group-hover:text-primary transition-colors`}>
              {auction.title}
            </CardTitle>
            
            <div className={`${
              isListView ? 'flex items-center justify-between' : 'space-y-2'
            }`}>
              <div className={`${isListView ? 'flex items-center gap-4' : 'flex items-center justify-between'} text-sm`}>
                <div>
                  <p className="text-muted-foreground">Current Bid</p>
                  <p className="font-semibold text-lg">
                    {formatDisplayAmount(auction.currentPrice)}
                  </p>
                </div>
                {auction.buyItNowPrice && (
                  <div>
                    <p className="text-muted-foreground">Buy Now</p>
                    <p className="font-medium text-green-600">
                      {formatDisplayAmount(auction.buyItNowPrice)}
                    </p>
                  </div>
                )}
                <div className={isListView ? '' : 'text-right'}>
                  <p className="text-muted-foreground">Time Left</p>
                  <p className={`font-medium ${
                    auction.timeRemaining < 3600000 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {formatTimeRemaining(auction.timeRemaining)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {auction.totalBids} bids
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {auction.viewCount || 0} views
              </span>
              {auction.timeRemaining < 3600000 && auction.timeRemaining > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Timer className="h-3 w-3 mr-1" />
                  Ending Soon
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Auctions</h1>
        <p className="text-muted-foreground">
          Discover amazing items and place your bids
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search auctions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search Button */}
              <Button type="submit" className="md:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${totalAuctions} auctions found`}
          </p>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Button
              variant={sortBy === 'endTime' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('endTime')}
              className="text-xs"
            >
              End Time
              {sortBy === 'endTime' && (
                sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
            <Button
              variant={sortBy === 'currentPrice' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('currentPrice')}
              className="text-xs"
            >
              Price
              {sortBy === 'currentPrice' && (
                sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
            <Button
              variant={sortBy === 'totalBids' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('totalBids')}
              className="text-xs"
            >
              Bids
              {sortBy === 'totalBids' && (
                sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Auction Grid/List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-12">
          <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or check back later for new auctions.
          </p>
        </div>
      ) : (
        <>
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {auctions.map((auction) => (
              <AuctionCard 
                key={auction._id} 
                auction={auction} 
                isListView={viewMode === 'list'} 
              />
            ))}
          </div>

          <Pagination />
        </>
      )}
    </div>
  );
};

export default Auctions;

