import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { auctionsAPI, bidsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Gavel, 
  Clock, 
  Users, 
  Eye,
  Star,
  ShoppingCart,
  AlertTriangle,
  Loader2,
  Heart,
  Share2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  CheckCircle,
  XCircle,
  Timer,
  Zap
} from 'lucide-react';

const AuctionDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user, canBidOnItem } = useAuth();
  const { formatDisplayAmount, getDualCurrencyDisplay } = useCurrency();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBidding, setIsBidding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [isAutoBidding, setIsAutoBidding] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showAutoBidDialog, setShowAutoBidDialog] = useState(false);
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchAuctionDetails();
      fetchBidHistory();
    }
  }, [id]);

  const fetchAuctionDetails = async () => {
    try {
      setIsLoading(true);
      const response = await auctionsAPI.getAuction(id);
      setAuction(response.data.auction);
      
      // Check if user is watching this auction
      if (isAuthenticated && response.data.auction.watchers?.includes(user?._id)) {
        setIsWatching(true);
      }
    } catch (error) {
      console.error('Failed to fetch auction details:', error);
      if (error.response?.status === 404) {
        navigate('/auctions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBidHistory = async () => {
    try {
      const response = await bidsAPI.getBidHistory(id, { limit: 20 });
      setBidHistory(response.data.bids || []);
    } catch (error) {
      console.error('Failed to fetch bid history:', error);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (!amount || amount <= auction.currentPrice) {
      setErrors({ bid: 'Bid amount must be higher than current price' });
      return;
    }

    if (!canBidOnItem(amount)) {
      setErrors({ bid: 'Insufficient balance. You need at least 20% of the bid amount in your balance.' });
      return;
    }

    try {
      setIsBidding(true);
      setErrors({});

      await bidsAPI.placeBid({
        auctionId: id,
        bidAmount: amount,
        isAutoBid: false,
      });

      setSuccess('Bid placed successfully!');
      setBidAmount('');
      setShowBidDialog(false);
      
      // Refresh auction details and bid history
      await fetchAuctionDetails();
      await fetchBidHistory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ bid: error.response?.data?.message || 'Failed to place bid' });
    } finally {
      setIsBidding(false);
    }
  };

  const handleAutoBid = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const maxAmount = parseFloat(maxBidAmount);
    if (!maxAmount || maxAmount <= auction.currentPrice) {
      setErrors({ autoBid: 'Maximum bid amount must be higher than current price' });
      return;
    }

    if (!canBidOnItem(maxAmount)) {
      setErrors({ autoBid: 'Insufficient balance. You need at least 20% of the maximum bid amount in your balance.' });
      return;
    }

    try {
      setIsBidding(true);
      setErrors({});

      await bidsAPI.placeBid({
        auctionId: id,
        bidAmount: auction.currentPrice + auction.bidIncrement,
        maxBidAmount: maxAmount,
        isAutoBid: true,
      });

      setSuccess('Auto-bid set successfully!');
      setMaxBidAmount('');
      setShowAutoBidDialog(false);
      
      // Refresh auction details and bid history
      await fetchAuctionDetails();
      await fetchBidHistory();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ autoBid: error.response?.data?.message || 'Failed to set auto-bid' });
    } finally {
      setIsBidding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!canBidOnItem(auction.buyItNowPrice)) {
      setErrors({ buyNow: 'Insufficient balance. You need at least 20% of the buy-it-now price in your balance.' });
      return;
    }

    try {
      setIsBuyingNow(true);
      setErrors({});

      await auctionsAPI.buyNow(id);

      setSuccess('Item purchased successfully! You will be contacted with payment and pickup details.');
      setShowBuyNowDialog(false);
      
      // Refresh auction details
      await fetchAuctionDetails();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setErrors({ buyNow: error.response?.data?.message || 'Failed to purchase item' });
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWatchAuction = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await auctionsAPI.watchAuction(id);
      setIsWatching(!isWatching);
      setSuccess(isWatching ? 'Removed from watchlist' : 'Added to watchlist');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining <= 0) return 'Auction Ended';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getMinimumBid = () => {
    return auction.currentPrice + (auction.bidIncrement || 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Auction Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The auction you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/auctions')}>
            Browse Auctions
          </Button>
        </div>
      </div>
    );
  }

  const isAuctionEnded = auction.timeRemaining <= 0;
  const isEndingSoon = auction.timeRemaining < 3600000; // Less than 1 hour
  const currentPriceDisplay = getDualCurrencyDisplay(auction.currentPrice);
  const buyNowPriceDisplay = auction.buyItNowPrice ? getDualCurrencyDisplay(auction.buyItNowPrice) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Success Message */}
      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                {auction.images && auction.images.length > 0 ? (
                  <img 
                    src={auction.images[selectedImageIndex]?.url || auction.images[0]?.url}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gavel className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {auction.images && auction.images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {auction.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img 
                          src={image.url} 
                          alt={`${auction.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auction Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{auction.category}</Badge>
                    {auction.featured && (
                      <Badge variant="default">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {isEndingSoon && !isAuctionEnded && (
                      <Badge variant="destructive">
                        <Timer className="h-3 w-3 mr-1" />
                        Ending Soon
                      </Badge>
                    )}
                    {isAuctionEnded && (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        Ended
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{auction.title}</CardTitle>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWatchAuction}
                    disabled={!isAuthenticated}
                  >
                    <Heart className={`h-4 w-4 ${isWatching ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="description" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {auction.description}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Condition</Label>
                      <p className="text-sm text-muted-foreground">{auction.condition || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Starting Price</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDisplayAmount(auction.startingPrice)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Bid Increment</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDisplayAmount(auction.bidIncrement)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Reserve Price</Label>
                      <p className="text-sm text-muted-foreground">
                        {auction.reservePrice ? formatDisplayAmount(auction.reservePrice) : 'No reserve'}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="shipping" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Pickup Location</Label>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {auction.pickupLocation || 'Lagos, Nigeria'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Shipping Options</Label>
                      <p className="text-sm text-muted-foreground">
                        Pickup only - Winner will be contacted with pickup details
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bidding */}
        <div className="space-y-6">
          {/* Current Bid Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Current Bid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {currentPriceDisplay.ngn.formatted}
                </div>
                <div className="text-lg text-muted-foreground">
                  ≈ {currentPriceDisplay.usd.formatted}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bids</p>
                  <p className="text-lg font-semibold">{auction.totalBids}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Watchers</p>
                  <p className="text-lg font-semibold">{auction.watchers?.length || 0}</p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time Remaining</span>
                </div>
                <div className={`text-xl font-bold ${
                  isAuctionEnded ? 'text-muted-foreground' : 
                  isEndingSoon ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {formatTimeRemaining(auction.timeRemaining)}
                </div>
              </div>

              {/* Bidding Actions */}
              {!isAuctionEnded && (
                <div className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      {/* Regular Bid */}
                      <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg">
                            <Gavel className="h-4 w-4 mr-2" />
                            Place Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Place Your Bid</DialogTitle>
                            <DialogDescription>
                              Minimum bid: {formatDisplayAmount(getMinimumBid())}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handlePlaceBid} className="space-y-4">
                            {errors.bid && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.bid}</AlertDescription>
                              </Alert>
                            )}
                            
                            <div className="space-y-2">
                              <Label htmlFor="bidAmount">Bid Amount (₦)</Label>
                              <Input
                                id="bidAmount"
                                type="number"
                                min={getMinimumBid()}
                                step="100"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                placeholder={`Minimum: ${getMinimumBid()}`}
                                disabled={isBidding}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button type="submit" disabled={isBidding} className="flex-1">
                                {isBidding ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Placing Bid...
                                  </>
                                ) : (
                                  'Place Bid'
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowBidDialog(false)}
                                disabled={isBidding}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* Auto Bid */}
                      <Dialog open={showAutoBidDialog} onOpenChange={setShowAutoBidDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Zap className="h-4 w-4 mr-2" />
                            Auto Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Set Auto Bid</DialogTitle>
                            <DialogDescription>
                              Set your maximum bid amount and we'll bid for you automatically
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAutoBid} className="space-y-4">
                            {errors.autoBid && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.autoBid}</AlertDescription>
                              </Alert>
                            )}
                            
                            <div className="space-y-2">
                              <Label htmlFor="maxBidAmount">Maximum Bid Amount (₦)</Label>
                              <Input
                                id="maxBidAmount"
                                type="number"
                                min={getMinimumBid()}
                                step="100"
                                value={maxBidAmount}
                                onChange={(e) => setMaxBidAmount(e.target.value)}
                                placeholder={`Minimum: ${getMinimumBid()}`}
                                disabled={isBidding}
                              />
                              <p className="text-xs text-muted-foreground">
                                We'll automatically bid up to this amount to keep you in the lead
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button type="submit" disabled={isBidding} className="flex-1">
                                {isBidding ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Setting Auto Bid...
                                  </>
                                ) : (
                                  'Set Auto Bid'
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAutoBidDialog(false)}
                                disabled={isBidding}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* Buy It Now */}
                      {auction.buyItNowPrice && (
                        <Dialog open={showBuyNowDialog} onOpenChange={setShowBuyNowDialog}>
                          <DialogTrigger asChild>
                            <Button variant="secondary" className="w-full">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy Now - {buyNowPriceDisplay?.ngn.formatted}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Buy It Now</DialogTitle>
                              <DialogDescription>
                                Purchase this item immediately for {buyNowPriceDisplay?.ngn.formatted}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {errors.buyNow && (
                                <Alert variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>{errors.buyNow}</AlertDescription>
                                </Alert>
                              )}
                              
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2">Purchase Summary</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Item:</span>
                                    <span>{auction.title}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Price:</span>
                                    <span className="font-semibold">{buyNowPriceDisplay?.ngn.formatted}</span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>USD Equivalent:</span>
                                    <span>{buyNowPriceDisplay?.usd.formatted}</span>
                                  </div>
                                </div>
                              </div>

                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  This will end the auction immediately. You will be contacted with payment and pickup details.
                                </AlertDescription>
                              </Alert>

                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleBuyNow} 
                                  disabled={isBuyingNow} 
                                  className="flex-1"
                                >
                                  {isBuyingNow ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Confirm Purchase'
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setShowBuyNowDialog(false)}
                                  disabled={isBuyingNow}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Button className="w-full" onClick={() => navigate('/login')}>
                        Login to Bid
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        You need to be logged in to place bids
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Balance Warning */}
              {isAuthenticated && !isAuctionEnded && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Balance Required:</strong> You need at least 20% of your bid amount in your account balance.
                    <br />
                    <strong>Your Balance:</strong> {formatDisplayAmount(user?.balance || 0)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Bid History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bid History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bidHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No bids yet. Be the first to bid!
                  </p>
                ) : (
                  bidHistory.map((bid, index) => (
                    <div key={bid._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {bid.bidder?.name || 'Anonymous'}
                            {bid.isAutoBid && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Auto
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bid.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatDisplayAmount(bid.bidAmount)}
                        </p>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            Highest
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{auction.seller?.name || 'NAuction Admin'}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Seller
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(auction.seller?.createdAt || auction.createdAt).getFullYear()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;

