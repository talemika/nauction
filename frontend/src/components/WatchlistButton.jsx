import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../contexts/AuthContext';

const WatchlistButton = ({ 
  auctionId, 
  variant = "outline", 
  size = "sm", 
  showText = true,
  className = "" 
}) => {
  const { isAuthenticated } = useAuth();
  const { isWatching, toggleWatchlist, error, clearError } = useWatchlist();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      // Could trigger a login modal here
      return;
    }

    setIsToggling(true);
    clearError();
    
    try {
      await toggleWatchlist(auctionId);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const isCurrentlyWatching = isWatching(auctionId);

  if (!isAuthenticated) {
    return null; // Don't show watchlist button for non-authenticated users
  }

  return (
    <Button
      variant={isCurrentlyWatching ? "default" : variant}
      size={size}
      onClick={handleToggle}
      disabled={isToggling}
      className={`${className} ${isCurrentlyWatching ? 'bg-red-500 hover:bg-red-600' : ''}`}
      title={isCurrentlyWatching ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 ${isCurrentlyWatching ? 'fill-current' : ''}`} 
        />
      )}
      {showText && (
        <span className="ml-2">
          {isCurrentlyWatching ? 'Watching' : 'Watch'}
        </span>
      )}
    </Button>
  );
};

export default WatchlistButton;

