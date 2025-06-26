import { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { auctionsAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Gavel, 
  Search, 
  Plus,
  Edit3,
  Trash2,
  Eye,
  Clock,
  Users,
  Star,
  ShoppingCart,
  Loader2,
  Calendar,
  DollarSign,
  Timer,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const AuctionManagement = () => {
  const { formatCurrency } = useCurrency();
  
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAuctions, setTotalAuctions] = useState(0);
  
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchAuctions();
  }, [searchQuery, selectedCategory, selectedStatus, currentPage]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        includeEnded: true, // Include ended auctions for admin
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      if (selectedStatus && selectedStatus !== 'all') {
        if (selectedStatus === 'active') {
          params.status = 'active';
        } else if (selectedStatus === 'ended') {
          params.status = 'ended';
        } else if (selectedStatus === 'featured') {
          params.featured = true;
        }
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
    fetchAuctions();
  };

  const handleDeleteAuction = (auction) => {
    setSelectedAuction(auction);
    setShowDeleteDialog(true);
    setErrors({});
  };

  const confirmDeleteAuction = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      await auctionsAPI.deleteAuction(selectedAuction._id);

      setSuccess('Auction deleted successfully');
      setShowDeleteDialog(false);
      await fetchAuctions();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ delete: error.response?.data?.message || 'Failed to delete auction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining <= 0) return 'Ended';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (auction) => {
    const isEnded = auction.timeRemaining <= 0;
    const isEndingSoon = auction.timeRemaining < 3600000; // Less than 1 hour

    if (isEnded) {
      return (
        <Badge variant="outline">
          <XCircle className="h-3 w-3 mr-1" />
          Ended
        </Badge>
      );
    }

    if (isEndingSoon) {
      return (
        <Badge variant="destructive">
          <Timer className="h-3 w-3 mr-1" />
          Ending Soon
        </Badge>
      );
    }

    return (
      <Badge variant="default">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalAuctions)} of {totalAuctions} auctions
        </p>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auction Management</h2>
          <p className="text-muted-foreground">
            Create, edit, and manage all auctions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Auction
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search auctions by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Button */}
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Auctions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Auctions ({totalAuctions})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-8">
              <Gavel className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or create a new auction
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctions.map((auction) => (
                    <TableRow key={auction._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                            {auction.images && auction.images.length > 0 ? (
                              <img 
                                src={auction.mainImage?.url || auction.images[0]?.url}
                                alt={auction.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gavel className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{auction.title}</p>
                            <div className="flex items-center gap-2 mt-1">
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{auction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">
                            {formatCurrency(auction.currentPrice, 'NGN')}
                          </p>
                          {auction.buyItNowPrice && (
                            <p className="text-xs text-muted-foreground">
                              Buy Now: {formatCurrency(auction.buyItNowPrice, 'NGN')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{auction.totalBids}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(auction)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-sm ${
                            auction.timeRemaining <= 0 ? 'text-muted-foreground' :
                            auction.timeRemaining < 3600000 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {formatTimeRemaining(auction.timeRemaining)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/auctions/${auction._id}`, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Edit auction */}}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAuction(auction)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination />
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Auction Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Auction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this auction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {errors.delete && (
              <Alert variant="destructive">
                <AlertDescription>{errors.delete}</AlertDescription>
              </Alert>
            )}
            
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="font-medium text-destructive">Warning</p>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Deleting auction: <strong>{selectedAuction?.title}</strong>
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Current Price: {formatCurrency(selectedAuction?.currentPrice || 0, 'NGN')}</p>
                <p>• Total Bids: {selectedAuction?.totalBids || 0}</p>
                <p>• This will permanently remove all auction data and bid history</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={confirmDeleteAuction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Auction'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuctionManagement;

