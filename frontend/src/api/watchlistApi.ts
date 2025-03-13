import { getAuthApiClient } from './apiClient';
import { WatchlistItem, WatchlistStatus } from './apiService';

const watchlistApi = {
  /**
   * Get the current user's watchlist
   */
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    // Using the correct endpoint based on backend
    const response = await getAuthApiClient().get<WatchlistItem[]>('/watchlist');
    
    // Add error handling to help diagnose API response issues
    console.log('Watchlist API response:', response.data);
    
    return response.data;
  },
  
  /**
   * Add a movie to the user's watchlist
   */
  addToWatchlist: async (movieId: number): Promise<void> => {
    await getAuthApiClient().post(`/watchlist/${movieId}`);
  },
  
  /**
   * Remove a movie from the user's watchlist
   */
  removeFromWatchlist: async (movieId: number): Promise<void> => {
    await getAuthApiClient().delete(`/watchlist/${movieId}`);
  },
  
  /**
   * Check if a movie is in the user's watchlist
   */
  checkWatchlistStatus: async (movieId: number): Promise<WatchlistStatus> => {
    try {
      const response = await getAuthApiClient().get<WatchlistStatus>(`/watchlist/${movieId}/status`);
      return response.data;
    } catch (error) {
      console.warn('Watchlist status endpoint not available');
      // Return default value as fallback
      return { inWatchlist: false };
    }
  }
};

export default watchlistApi;
