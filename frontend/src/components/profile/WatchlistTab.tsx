import { WatchlistItem } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import { 
  Card,
} from "@/components/ui/card";
import { Film, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WatchlistTabProps {
  watchlist: WatchlistItem[];
  displayedItems: WatchlistItem[];
  loadingMore: boolean;
  hasMore: boolean;
  removingItemId: number | null;
  onRemoveItem: (id: number) => void;
  watchlistEndRef: React.RefObject<HTMLDivElement>;
  isViewOnly?: boolean; 
}

export default function WatchlistTab({
  watchlist,
  displayedItems,
  loadingMore,
  hasMore,
  removingItemId,
  onRemoveItem,
  watchlistEndRef,
  isViewOnly = false, 
}: WatchlistTabProps) {

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 bg-muted/50 rounded-lg">
        <Film className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg sm:text-xl font-medium">Watchlist is empty</h3>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          No movies in this watchlist yet.
        </p>
        <Button asChild className="mt-4">
          <Link to="/movies">Browse Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayedItems.map((item) => {
          const movie = item.movie || item;
          const itemId = item.id || (movie?.id || 0);
          
          if (!movie || typeof movie !== 'object') {
            console.error('Invalid movie data in watchlist item:', item);
            return null;
          }
          
          return (
            <Card key={itemId} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow relative group">
              <Link to={`/movies/${movie.id}`} className="h-full">
                <div className="aspect-[2/3] relative">
                  <img 
                    src={movie.posterURL || '/placeholder-poster.jpg'} 
                    alt={movie.title || 'Movie poster'} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-poster.jpg';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">
                      {movie.title || 'Untitled Movie'}
                    </h3>
                    <p className="text-white text-xs opacity-90">{movie.year || 'N/A'}</p>
                  </div>
                </div>
              </Link>
              
              {!isViewOnly && (
                <button
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  onClick={() => onRemoveItem(movie.id)}
                  disabled={removingItemId === movie.id}
                  aria-label="Remove from watchlist"
                >
                  {removingItemId === movie.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Remove from watchlist</span>
                </button>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Infinite scroll loader */}
      <div ref={watchlistEndRef} className="py-8 flex justify-center">
        {loadingMore && (
          <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        )}
        {!hasMore && watchlist.length > displayedItems.length && (
          <p className="text-sm text-muted-foreground">You've reached the end of the watchlist</p>
        )}
      </div>
    </>
  );
}
