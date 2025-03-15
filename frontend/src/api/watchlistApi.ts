import { getAuthApiClient } from './apiClient';
import { WatchlistItem, WatchlistStatus } from './apiService';

const watchlistApi = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    try {
      const response = await getAuthApiClient().get<WatchlistItem[]>('/watchlist');
      
      if (!Array.isArray(response.data)) {
        console.error('Unexpected watchlist data format:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  },
  
  addToWatchlist: async (movieId: number): Promise<void> => {
    try {
      await getAuthApiClient().post(`/watchlist/${movieId}`);
    } catch (error) {
      console.error(`Failed to add movie ${movieId} to watchlist:`, error);
      throw error;
    }
  },
  
  removeFromWatchlist: async (movieId: number): Promise<void> => {
    try {
      await getAuthApiClient().delete(`/watchlist/${movieId}`);
    } catch (error) {
      console.error(`Failed to remove movie ${movieId} from watchlist:`, error);
      throw error;
    }
  },
  
  checkWatchlistStatus: async (movieId: number): Promise<WatchlistStatus> => {
    try {
      const response = await getAuthApiClient().get<WatchlistStatus>(`/watchlist/${movieId}/status`);
      return response.data;
    } catch (error) {
      console.warn(`Watchlist status check failed for movie ${movieId}:`, error);
      return { inWatchlist: false };
    }
  },

  batchCheckWatchlistStatus: async (movieIds: number[]): Promise<Record<number, boolean>> => {
    if (!movieIds.length) return {};
    
    try {
      const watchlist = await watchlistApi.getWatchlist();
      
      const watchlistMovieIds = new Set<number>();
      
      watchlist.forEach(item => {
        try {
          if (item.movie && typeof item.movie === 'object') {
            if ('id' in item.movie) {
              watchlistMovieIds.add(item.movie.id);
              return;
            }
          }
          
          if (item && typeof item === 'object' && 'id' in item) {
            if ((item as any).id !== (item as any).movieId && typeof (item as any).id === 'number') {
              watchlistMovieIds.add((item as any).id);
              return;
            }
          }
          
          const possibleMovieId = (item as any).movieId;
          if (typeof possibleMovieId === 'number') {
            watchlistMovieIds.add(possibleMovieId);
            return;
          }
          
          const otherPossibleIds = [
            (item as any).movie_id,
            (item as any).movie?.movieId,
            (item as any).movie_item_id
          ];
          
          for (const possibleId of otherPossibleIds) {
            if (typeof possibleId === 'number') {
              watchlistMovieIds.add(possibleId);
              return;
            }
          }
          
          console.warn('Could not extract movie ID from watchlist item:', item);
        } catch (err) {
          console.error('Error processing watchlist item:', item, err);
        }
      });
      
      if (watchlistMovieIds.size === 0 && watchlist.length > 0) {
        console.warn('Failed to extract movie IDs from watchlist. Using individual API calls.');
        
        const result: Record<number, boolean> = {};
        await Promise.all(
          movieIds.map(async (id) => {
            try {
              const status = await watchlistApi.checkWatchlistStatus(id);
              result[id] = status.inWatchlist;
            } catch (e) {
              console.error(`Error checking status for movie ${id}:`, e);
              result[id] = false;
            }
          })
        );
        
        return result;
      }
      
      const result: Record<number, boolean> = {};
      movieIds.forEach(id => {
        result[id] = watchlistMovieIds.has(id);
      });
      
      return result;
    } catch (error) {
      console.error('Error checking batch watchlist status:', error);
      return movieIds.reduce((acc, id) => {
        acc[id] = false;
        return acc;
      }, {} as Record<number, boolean>);
    }
  }
};

export default watchlistApi;
