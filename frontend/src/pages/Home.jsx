import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { auctionsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gavel, 
  TrendingUp, 
  Clock, 
  Users, 
  Shield, 
  Star,
  ArrowRight,
  Search,
  Timer,
  Eye
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const { formatDisplayAmount } = useCurrency();
  const navigate = useNavigate();
  
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [endingSoonAuctions, setEndingSoonAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured auctions
      const featuredResponse = await auctionsAPI.getFeatured(6);
      setFeaturedAuctions(featuredResponse.data.auctions || []);

      // Fetch ending soon auctions
      const endingSoonResponse = await auctionsAPI.getEndingSoon(24, 6);
      setEndingSoonAuctions(endingSoonResponse.data.auctions || []);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
    }
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

  const AuctionCard = ({ auction, showBadge = false }) => (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
      <Link to={`/auctions/${auction._id}`}>
        <CardHeader className="p-4">
          <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
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
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {auction.category}
              </Badge>
              {showBadge && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {auction.title}
            </CardTitle>
            
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Current Bid</p>
                <p className="font-semibold text-lg">
                  {formatDisplayAmount(auction.currentPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Time Left</p>
                <p className="font-medium text-orange-600">
                  {formatTimeRemaining(auction.timeRemaining)}
                </p>
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
            </div>
          </div>
        </CardHeader>
      </Link>
    </Card>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              Welcome to <span className="text-primary">NAuction</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Nigeria's premier online auction platform. Discover unique items, 
              place bids, and win amazing deals.
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/register')}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auctions')}>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Auctions
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">
                  Welcome back, <span className="font-semibold">{user?.name}</span>!
                </p>
                <Button size="lg" onClick={() => navigate('/auctions')}>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Auctions
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose NAuction?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the best online auction platform with secure bidding, 
              transparent processes, and amazing deals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Secure & Trusted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Your transactions are protected with bank-level security. 
                  Only verified users can participate in auctions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Fair Bidding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Transparent bidding process with real-time updates. 
                  Auto-bidding features help you stay competitive.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Round-the-clock customer support to help you with 
                  any questions or issues during your auction experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      {featuredAuctions.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Auctions</h2>
                <p className="text-muted-foreground">
                  Hand-picked premium items with exceptional value
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/auctions?featured=true')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAuctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} showBadge />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ending Soon */}
      {endingSoonAuctions.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Timer className="h-8 w-8 text-orange-600" />
                  Ending Soon
                </h2>
                <p className="text-muted-foreground">
                  Don't miss out on these auctions ending within 24 hours
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/auctions?endingSoon=true')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endingSoonAuctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Ready to Start Bidding?</h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of satisfied customers who have found amazing deals on NAuction.
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/register')}>
                  Create Account
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/bidding-info')}>
                  Learn How to Bid
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => navigate('/auctions')}>
                Start Bidding Now
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

