import { useState, useEffect, useCallback } from 'react';
import { auctionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const useWatchlist = () => {
  const { isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [watchedAuctions, setWatchedAuctions] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await auctionsAPI.getWatchlist();
      const watchlistData = response.data.watchlist || [];
      setWatchlist(watchlistData);
      
      // Create a Set of watched auction IDs for quick lookup
      const watchedIds = new Set(watchlistData.map(item => item._id));
      setWatchedAuctions(watchedIds);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Check if a specific auction is being watched
  const isWatching = useCallback((auctionId) => {
    return watchedAuctions.has(auctionId);
  }, [watchedAuctions]);

  // Add auction to watchlist
  const addToWatchlist = useCallback(async (auctionId) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your watchlist');
      return false;
    }

    try {
      setError(null);
      await auctionsAPI.watchAuction(auctionId);
      
      // Update local state
      setWatchedAuctions(prev => new Set([...prev, auctionId]));
      
      // Refresh watchlist to get updated data
      await fetchWatchlist();
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to watchlist');
      console.error('Error adding to watchlist:', err);
      return false;
    }
  }, [isAuthenticated, fetchWatchlist]);

  // Remove auction from watchlist
  const removeFromWatchlist = useCallback(async (auctionId) => {
    if (!isAuthenticated) {
      setError('Please log in to manage your watchlist');
      return false;
    }

    try {
      setError(null);
      await auctionsAPI.unwatchAuction(auctionId);
      
      // Update local state
      setWatchedAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(auctionId);
        return newSet;
      });
      
      // Refresh watchlist to get updated data
      await fetchWatchlist();
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove from watchlist');
      console.error('Error removing from watchlist:', err);
      return false;
    }
  }, [isAuthenticated, fetchWatchlist]);

  // Toggle watchlist status
  const toggleWatchlist = useCallback(async (auctionId) => {
    const isCurrentlyWatching = isWatching(auctionId);
    
    if (isCurrentlyWatching) {
      return await removeFromWatchlist(auctionId);
    } else {
      return await addToWatchlist(auctionId);
    }
  }, [isWatching, addToWatchlist, removeFromWatchlist]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize watchlist when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    } else {
      // Clear watchlist when user logs out
      setWatchlist([]);
      setWatchedAuctions(new Set());
      setError(null);
    }
  }, [isAuthenticated, fetchWatchlist]);

  return {
    watchlist,
    watchedAuctions,
    isLoading,
    error,
    isWatching,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    fetchWatchlist,
    clearError,
    watchlistCount: watchlist.length
  };
};

export default useWatchlist;

